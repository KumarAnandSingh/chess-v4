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

// Parse frontend URLs from environment
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ["http://localhost:3000", "http://localhost:1420", "http://localhost:3002", "http://localhost:3006", "http://localhost:3007"];

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      console.log('Socket.IO CORS origin check:', origin);
      console.log('Allowed origins:', frontendUrls);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (frontendUrls.includes(origin)) {
        console.log('✅ Socket.IO CORS: Origin allowed:', origin);
        callback(null, true);
      } else {
        console.log('❌ Socket.IO CORS: Origin denied:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true // Allow backwards compatibility
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
  origin: function (origin, callback) {
    console.log('CORS origin check:', origin);
    console.log('Allowed origins:', frontendUrls);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (frontendUrls.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin denied:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
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
      console.log(`Room creation request from ${session.username} (${socket.id}):`, data);
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

      console.log(`Room creation result:`, result);
      callback(result);
    } catch (error) {
      console.error('Error creating room:', error);
      const errorResult = { success: false, error: 'Failed to create room' };
      console.log(`Room creation error result:`, errorResult);
      callback(errorResult);
    }
  });

  // Join room via socket
  socket.on('join_room', (data, callback) => {
    try {
      console.log(`\n🚪 JOIN_ROOM EVENT from ${session.username} (${socket.id})`);
      console.log(`Request data:`, JSON.stringify(data, null, 2));

      const { roomCode, isSpectator } = data;
      const result = roomManager.joinRoom(roomCode, socket.id, session.username, isSpectator);
      console.log(`RoomManager result:`, JSON.stringify(result, null, 2));

      if (result.success) {
        // Join socket room
        socket.join(`room_${roomCode}`);
        console.log(`✅ Player ${session.username} (${socket.id}) joined socket room room_${roomCode}`);

        // Verify socket room membership
        const socketsInRoom = io.sockets.adapter.rooms.get(`room_${roomCode}`);
        console.log(`🔌 Current sockets in room_${roomCode}:`, socketsInRoom ? Array.from(socketsInRoom) : 'No sockets');
        console.log(`🏠 Socket rooms for ${socket.id}:`, Array.from(socket.rooms));

        // Emit to room
        const roomUpdateData = {
          room: result.room,
          event: 'player_joined',
          player: {
            name: session.username,
            role: result.role,
            color: result.color
          }
        };
        console.log(`📡 Emitting room_updated to room_${roomCode}:`, JSON.stringify(roomUpdateData, null, 2));
        socket.to(`room_${roomCode}`).emit('room_updated', roomUpdateData);

        // If room is full and ready, start game
        const room = roomManager.getRoomInfo(roomCode);
        console.log(`📊 Room ${roomCode} status: playerCount=${room?.playerCount}, status=${room?.status}`);

        if (room && room.playerCount === 2 && (room.status === 'waiting' || room.status === 'ready')) {
          console.log(`🎮 Room ${roomCode} is full (${room.playerCount}/2 players), starting game...`);

          // Verify both sockets are actually in the room before starting
          const socketsInRoom = io.sockets.adapter.rooms.get(`room_${roomCode}`);
          const expectedSocketCount = 2;

          if (socketsInRoom && socketsInRoom.size >= expectedSocketCount) {
            console.log(`✅ Verified ${socketsInRoom.size} sockets in room, starting game immediately`);
            startRoomGame(roomCode);
          } else {
            console.log(`⏳ Only ${socketsInRoom?.size || 0}/${expectedSocketCount} sockets in room, waiting with longer delay`);
            // Longer delay with verification retry
            setTimeout(() => {
              const socketsInRoomRetry = io.sockets.adapter.rooms.get(`room_${roomCode}`);
              if (socketsInRoomRetry && socketsInRoomRetry.size >= expectedSocketCount) {
                startRoomGame(roomCode);
              } else {
                console.log(`❌ Still only ${socketsInRoomRetry?.size || 0}/${expectedSocketCount} sockets after retry, forcing game start anyway`);
                startRoomGame(roomCode);
              }
            }, 500);
          }
        } else {
          console.log(`⏳ Room ${roomCode} not ready for game start - playerCount: ${room?.playerCount}, status: ${room?.status}`);
        }
      } else {
        console.log(`❌ Failed to join room ${roomCode}:`, result.error);
      }

      console.log(`📤 Sending callback response:`, JSON.stringify(result, null, 2));
      callback(result);
    } catch (error) {
      console.error('❌ Error joining room:', error);
      console.error('Stack trace:', error.stack);
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
    console.log(`\n=== STARTING ROOM GAME FOR ${roomCode} ===`);
    const room = roomManager.getRoomInfo(roomCode);
    console.log(`Room info for ${roomCode}:`, JSON.stringify(room, null, 2));

    if (!room || room.playerCount !== 2) {
      console.log(`❌ Cannot start game - Room: ${room ? 'exists' : 'not found'}, Player count: ${room?.playerCount || 0}`);
      return;
    }

    const players = room.players.map(player => ({
      id: player.id,
      name: player.name,
      color: player.color
    }));
    console.log(`Players for game:`, JSON.stringify(players, null, 2));

    const game = new GameState(room.gameSettings, players);
    activeGames.set(game.gameId, game);
    console.log(`✅ Game created with ID: ${game.gameId}`);

    const startResult = game.startGame();
    console.log(`Game start result:`, JSON.stringify(startResult, null, 2));

    if (startResult.success) {
      // Update room status to playing
      roomManager.updateRoomStatus(roomCode, 'playing');

      // Get fresh room info after status update
      const updatedRoom = roomManager.getRoomInfo(roomCode);

      // Enhance gameState with socket IDs for proper player identification
      const enhancedGameState = {
        ...startResult.gameState,
        players: players.map(player => ({
          id: player.id, // This is the socket ID
          name: player.name,
          color: player.color,
          rating: 1200 // Add default rating if needed
        }))
      };

      // Emit game start to room
      const gameStartData = {
        gameId: game.gameId,
        gameState: enhancedGameState,
        room: updatedRoom
      };
      console.log(`\n📡 EMITTING game_started EVENT to room_${roomCode}`);
      console.log(`Event data:`, JSON.stringify(gameStartData, null, 2));

      // Get sockets in the room for debugging
      const socketsInRoom = io.sockets.adapter.rooms.get(`room_${roomCode}`);
      console.log(`🔌 Sockets in room_${roomCode}:`, socketsInRoom ? Array.from(socketsInRoom) : 'No sockets found');

      // Verify each socket individually and emit directly if needed
      if (socketsInRoom && socketsInRoom.size >= 2) {
        // Emit to the room first
        io.to(`room_${roomCode}`).emit('game_started', gameStartData);
        console.log(`📤 game_started event emitted to room_${roomCode}`);

        // Also emit directly to each socket as a backup
        socketsInRoom.forEach(socketId => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit('game_started', gameStartData);
            console.log(`🎯 game_started event emitted directly to socket ${socketId}`);
          }
        });
      } else {
        console.log(`⚠️ Warning: Expected 2 sockets in room but found ${socketsInRoom?.size || 0}`);
        // Still try to emit to the room
        io.to(`room_${roomCode}`).emit('game_started', gameStartData);
      }

      console.log(`✅ Game started in room ${roomCode}: ${game.gameId}`);
      console.log(`=== END STARTING ROOM GAME ===\n`);
    } else {
      console.log(`❌ Failed to start game:`, startResult);
    }

  } catch (error) {
    console.error('❌ Error starting room game:', error);
    console.error('Stack trace:', error.stack);
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

// Only start the listener if this file is executed directly,
// not when it is imported by tests or other modules.
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🏠 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Socket.IO: http://localhost:${PORT}/socket.io`);
    console.log(`📁 Room API: http://localhost:${PORT}/api/rooms`);
  });
}

module.exports = server;