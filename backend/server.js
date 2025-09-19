/**
 * Chess v4 Backend Server
 * Main server file with Express, Socket.IO, and room management
 * Combines features from v0 and v3 with new room invitation system
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import our modules
const RoomManager = require('./services/RoomManager');
const GameState = require('./models/GameState');
const { AuthManager, sessionMiddleware, socketAuthMiddleware } = require('./middleware/auth');
const createRoomRoutes = require('./routes/rooms');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:1420"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize managers
const roomManager = new RoomManager();
const authManager = new AuthManager();

/** @type {Map<string, GameState>} Active games by gameId */
const activeGames = new Map();

/** @type {Map<string, Set>} Matchmaking queue by time control */
const matchmakingQueues = new Map();

// Port configuration
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:1420"],
  credentials: true
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});
app.use(limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeRooms: roomManager.getAllRooms().length,
    activeSessions: authManager.getActiveSessions().length,
    activeGames: activeGames.size,
    memory: process.memoryUsage(),
    version: '4.0.0'
  };

  res.json(healthData);
});

// Server status endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Chess v4 Backend',
    version: '4.0.0',
    description: 'Enhanced multiplayer chess server with room invitation system',
    features: [
      'Room-based private games',
      'Random matchmaking',
      'Real-time multiplayer',
      'Multiple time controls',
      'Spectator mode',
      'Chat system',
      'Reconnection handling'
    ],
    endpoints: {
      health: '/api/health',
      rooms: '/api/rooms',
      socket: '/socket.io'
    }
  });
});

// Room API routes
app.use('/api/rooms', createRoomRoutes(roomManager, authManager));

// Socket.IO authentication middleware
io.use(socketAuthMiddleware(authManager));

// Socket.IO connection handling
io.on('connection', (socket) => {
  const session = socket.session;
  console.log(`User connected: ${session.username} (${socket.id})`);

  // Handle reconnection
  if (socket.isReconnection) {
    handleReconnection(socket);
  }

  // Emit connection success
  socket.emit('authenticated', {
    success: true,
    session: {
      sessionId: session.sessionId,
      username: session.username,
      rating: session.rating,
      preferences: session.preferences
    },
    isReconnection: socket.isReconnection
  });

  /**
   * Room Management Events
   */

  // Create room via socket (alternative to REST API)
  socket.on('create_room', (data, callback) => {
    try {
      const { gameSettings } = data;
      const result = roomManager.createRoom(socket.id, session.username, gameSettings);

      if (result.success) {
        socket.join(`room_${result.roomCode}`);

        // Emit to room
        socket.to(`room_${result.roomCode}`).emit('room_updated', {
          room: result.room,
          event: 'player_joined'
        });
      }

      callback(result);
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  // Join room via socket
  socket.on('join_room', (data, callback) => {
    try {
      const { roomCode, isSpectator } = data;
      const result = roomManager.joinRoom(roomCode, socket.id, session.username, isSpectator);

      if (result.success) {
        socket.join(`room_${roomCode}`);

        // Emit to room
        socket.to(`room_${roomCode}`).emit('room_updated', {
          room: result.room,
          event: 'player_joined',
          player: {
            name: session.username,
            role: result.role,
            color: result.color
          }
        });

        // If room is full and ready, start game
        const room = roomManager.getRoomInfo(roomCode);
        if (room && room.playerCount === 2 && room.status === 'waiting') {
          startRoomGame(roomCode);
        }
      }

      callback(result);
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leave_room', (data, callback) => {
    try {
      const result = roomManager.leaveRoom(socket.id);

      if (result.success && result.roomCode) {
        socket.leave(`room_${result.roomCode}`);

        // Emit to room
        socket.to(`room_${result.roomCode}`).emit('room_updated', {
          room: roomManager.getRoomInfo(result.roomCode),
          event: 'player_left',
          player: {
            name: session.username
          }
        });
      }

      callback(result);
    } catch (error) {
      console.error('Error leaving room:', error);
      callback({ success: false, error: 'Failed to leave room' });
    }
  });

  /**
   * Matchmaking Events (from v3)
   */

  // Join matchmaking queue
  socket.on('join_matchmaking', (data, callback) => {
    try {
      const { timeControl = 'blitz', rated = false } = data;
      const queueKey = `${timeControl}_${rated}`;

      if (!matchmakingQueues.has(queueKey)) {
        matchmakingQueues.set(queueKey, new Set());
      }

      const queue = matchmakingQueues.get(queueKey);

      // Remove from any existing queues
      for (const [key, existingQueue] of matchmakingQueues) {
        existingQueue.delete(socket.id);
      }

      // Add to appropriate queue
      queue.add(socket.id);
      socket.matchmakingQueue = queueKey;

      console.log(`${session.username} joined ${queueKey} queue (${queue.size} players)`);

      // Try to match players
      if (queue.size >= 2) {
        const players = Array.from(queue).slice(0, 2);
        createMatchmakingGame(players, { timeControl, rated });

        // Remove matched players from queue
        players.forEach(playerId => queue.delete(playerId));
      }

      callback({
        success: true,
        queuePosition: queue.size,
        timeControl,
        rated
      });

    } catch (error) {
      console.error('Error joining matchmaking:', error);
      callback({ success: false, error: 'Failed to join matchmaking' });
    }
  });

  // Leave matchmaking queue
  socket.on('leave_matchmaking', (callback) => {
    try {
      if (socket.matchmakingQueue) {
        const queue = matchmakingQueues.get(socket.matchmakingQueue);
        if (queue) {
          queue.delete(socket.id);
        }
        delete socket.matchmakingQueue;
      }

      callback({ success: true });
    } catch (error) {
      console.error('Error leaving matchmaking:', error);
      callback({ success: false, error: 'Failed to leave matchmaking' });
    }
  });

  /**
   * Game Events
   */

  // Make chess move
  socket.on('make_move', (data, callback) => {
    try {
      const { gameId, from, to, promotion } = data;
      const game = activeGames.get(gameId);

      if (!game) {
        return callback({ success: false, error: 'Game not found' });
      }

      const result = game.makeMove(socket.id, from, to, promotion);

      if (result.success) {
        // Broadcast move to all players in game
        const room = getGameRoom(gameId);
        if (room) {
          io.to(room).emit('move_made', {
            gameId,
            move: result.move,
            gameState: result.gameState
          });
        }

        // Check if game ended
        if (game.status === 'finished') {
          handleGameEnd(game);
        }
      }

      callback(result);
    } catch (error) {
      console.error('Error making move:', error);
      callback({ success: false, error: 'Failed to make move' });
    }
  });

  // Resign game
  socket.on('resign', (data, callback) => {
    try {
      const { gameId } = data;
      const game = activeGames.get(gameId);

      if (!game) {
        return callback({ success: false, error: 'Game not found' });
      }

      const result = game.resign(socket.id);

      if (result.success) {
        const room = getGameRoom(gameId);
        if (room) {
          io.to(room).emit('game_ended', {
            gameId,
            result: result.result,
            endReason: result.endReason,
            gameState: result.gameState
          });
        }

        handleGameEnd(game);
      }

      callback(result);
    } catch (error) {
      console.error('Error resigning:', error);
      callback({ success: false, error: 'Failed to resign' });
    }
  });

  // Offer/accept draw
  socket.on('draw_offer', (data, callback) => {
    try {
      const { gameId, action } = data; // action: 'offer' or 'accept'
      const game = activeGames.get(gameId);

      if (!game) {
        return callback({ success: false, error: 'Game not found' });
      }

      const result = game.handleDraw(socket.id, action);

      if (result.success) {
        const room = getGameRoom(gameId);
        if (room) {
          if (action === 'offer') {
            io.to(room).emit('draw_offered', {
              gameId,
              gameState: result.gameState
            });
          } else if (action === 'accept' && game.status === 'finished') {
            io.to(room).emit('game_ended', {
              gameId,
              result: result.result,
              endReason: result.endReason,
              gameState: result.gameState
            });
            handleGameEnd(game);
          }
        }
      }

      callback(result);
    } catch (error) {
      console.error('Error handling draw:', error);
      callback({ success: false, error: 'Failed to handle draw' });
    }
  });

  // Chat message
  socket.on('chat_message', (data, callback) => {
    try {
      const { gameId, message, type = 'chat' } = data;
      const game = activeGames.get(gameId);

      if (!game) {
        return callback({ success: false, error: 'Game not found' });
      }

      const result = game.addChatMessage(socket.id, message, type);

      if (result.success) {
        const room = getGameRoom(gameId);
        if (room) {
          io.to(room).emit('chat_message', {
            gameId,
            message: result.message
          });
        }
      }

      callback(result);
    } catch (error) {
      console.error('Error sending chat:', error);
      callback({ success: false, error: 'Failed to send message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    handleDisconnection(socket);
  });

  // Update activity on any event
  socket.onAny(() => {
    authManager.updateActivity(socket.id);
  });
});

/**
 * Helper Functions
 */

function handleReconnection(socket) {
  const session = socket.session;
  console.log(`Handling reconnection for ${session.username}`);

  // Check if user was in a room
  const room = roomManager.getPlayerRoom(socket.id);
  if (room) {
    socket.join(`room_${room.code}`);

    // If there's an active game, emit current state
    for (const [gameId, game] of activeGames) {
      const playerInGame = game.players.find(p => p.id === socket.id);
      if (playerInGame) {
        socket.emit('game_state', {
          gameId,
          gameState: game.getGameState()
        });
        break;
      }
    }
  }

  // Update connection status
  for (const [gameId, game] of activeGames) {
    game.updatePlayerConnection(socket.id, true);
  }
}

function handleDisconnection(socket) {
  const session = socket.session;
  console.log(`User disconnected: ${session.username} (${socket.id})`);

  // Handle auth disconnect
  authManager.handleDisconnect(socket.id);

  // Remove from matchmaking queues
  for (const [key, queue] of matchmakingQueues) {
    queue.delete(socket.id);
  }

  // Update game connection status
  for (const [gameId, game] of activeGames) {
    game.updatePlayerConnection(socket.id, false);
  }

  // Handle room disconnect with grace period
  setTimeout(() => {
    // Check if user reconnected
    const updatedSession = authManager.getSessionBySocket(socket.id);
    if (!updatedSession || !updatedSession.isActive) {
      roomManager.leaveRoom(socket.id);
    }
  }, 30000); // 30 second grace period
}

function startRoomGame(roomCode) {
  try {
    const room = roomManager.getRoomInfo(roomCode);
    if (!room || room.playerCount !== 2) {
      return;
    }

    const players = room.players.map(player => ({
      id: player.id,
      name: player.name,
      color: player.color
    }));

    const game = new GameState(room.gameSettings, players);
    activeGames.set(game.gameId, game);

    const startResult = game.startGame();

    if (startResult.success) {
      // Emit game start to room
      io.to(`room_${roomCode}`).emit('game_started', {
        gameId: game.gameId,
        gameState: startResult.gameState,
        room: room
      });

      console.log(`Game started in room ${roomCode}: ${game.gameId}`);
    }

  } catch (error) {
    console.error('Error starting room game:', error);
  }
}

function createMatchmakingGame(playerIds, settings) {
  try {
    const players = playerIds.map((playerId, index) => {
      const session = authManager.getSessionBySocket(playerId);
      return {
        id: playerId,
        name: session ? session.username : `Player ${index + 1}`,
        color: index === 0 ? 'white' : 'black'
      };
    });

    const game = new GameState(settings, players);
    activeGames.set(game.gameId, game);

    // Create temporary room for matched players
    const gameRoom = `game_${game.gameId}`;
    playerIds.forEach(playerId => {
      const socket = io.sockets.sockets.get(playerId);
      if (socket) {
        socket.join(gameRoom);
      }
    });

    const startResult = game.startGame();

    if (startResult.success) {
      io.to(gameRoom).emit('game_found', {
        gameId: game.gameId,
        gameState: startResult.gameState,
        players: players
      });

      console.log(`Matchmaking game started: ${game.gameId}`);
    }

  } catch (error) {
    console.error('Error creating matchmaking game:', error);
  }
}

function handleGameEnd(game) {
  try {
    // Update player ratings (simple ELO calculation)
    if (game.settings.rated && game.result !== 'abandoned') {
      updatePlayerRatings(game);
    }

    // Clean up game after delay
    setTimeout(() => {
      activeGames.delete(game.gameId);
      console.log(`Game cleaned up: ${game.gameId}`);
    }, 300000); // 5 minutes

  } catch (error) {
    console.error('Error handling game end:', error);
  }
}

function updatePlayerRatings(game) {
  // Simple ELO rating system
  const K = 32; // K-factor

  game.players.forEach(player => {
    const session = authManager.getSessionBySocket(player.id);
    if (session) {
      let score = 0.5; // Draw
      if (game.result === player.color) {
        score = 1; // Win
      } else if (game.result !== 'draw') {
        score = 0; // Loss
      }

      const opponentRating = game.players.find(p => p.id !== player.id)?.rating || session.rating;
      const expected = 1 / (1 + Math.pow(10, (opponentRating - session.rating) / 400));
      const newRating = Math.round(session.rating + K * (score - expected));

      authManager.updateRating(session.sessionId, newRating,
        score === 1 ? 'win' : score === 0 ? 'loss' : 'draw');
    }
  });
}

function getGameRoom(gameId) {
  // Check if it's a room-based game
  for (const [roomCode, room] of roomManager.rooms) {
    // This is simplified - you might want to store game-room mapping
    if (room.gameState && room.gameState.gameId === gameId) {
      return `room_${roomCode}`;
    }
  }

  // Otherwise it's a matchmaking game
  return `game_${gameId}`;
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
🚀 Chess v4 Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🏠 Health check: http://localhost:${PORT}/api/health
🔗 Socket.IO: http://localhost:${PORT}/socket.io
📁 Room API: http://localhost:${PORT}/api/rooms

Features enabled:
✅ Room-based private games with 4-digit codes
✅ Random matchmaking system
✅ Real-time multiplayer with Socket.IO
✅ Multiple time controls (Bullet, Blitz, Rapid, Classical)
✅ Chat system with quick messages
✅ Spectator mode support
✅ Reconnection handling
✅ Authentication and session management
✅ Comprehensive error handling
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = { app, server, io };