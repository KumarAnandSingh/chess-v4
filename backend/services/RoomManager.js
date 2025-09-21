/**
 * RoomManager Service
 * Handles room creation, management, and cleanup for Chess v4
 * Generates 4-digit alphanumeric room codes and manages room lifecycle
 */

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();

    /** @type {Map<string, string>} Map of socketId to roomCode */
    this.playerRooms = new Map();

    // Start cleanup interval (every 5 minutes)
    this.startCleanupInterval();
  }

  /**
   * Generates a 4-character alphanumeric room code
   * Format: 2 letters + 2 numbers (e.g., "AB12", "XY99")
   * @returns {string} Generated room code
   */
  generateRoomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let code = '';
    // Generate 2 letters
    for (let i = 0; i < 2; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // Generate 2 numbers
    for (let i = 0; i < 2; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return code;
  }

  /**
   * Creates a new room with unique code
   * @param {string} creatorId - Socket ID of room creator
   * @param {string} creatorName - Display name of creator
   * @param {Object} gameSettings - Game configuration
   * @returns {Object} Room creation result
   */
  createRoom(creatorId, creatorName, gameSettings = {}) {
    try {
      let roomCode = this.generateRoomCode();
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure unique room code
      while (this.rooms.has(roomCode) && attempts < maxAttempts) {
        roomCode = this.generateRoomCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique room code');
      }

      const room = new Room(roomCode, creatorId, creatorName, gameSettings);
      this.rooms.set(roomCode, room);
      this.playerRooms.set(creatorId, roomCode);

      console.log(`Room created: ${roomCode} by ${creatorName} (${creatorId})`);

      return {
        success: true,
        roomCode,
        room: this.getRoomInfo(roomCode)
      };
    } catch (error) {
      console.error('Error creating room:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Join an existing room
   * @param {string} roomCode - Room code to join
   * @param {string} playerId - Socket ID of joining player
   * @param {string} playerName - Display name of player
   * @param {boolean} isSpectator - Whether joining as spectator
   * @returns {Object} Join result
   */
  joinRoom(roomCode, playerId, playerName, isSpectator = false) {
    try {
      roomCode = roomCode.toUpperCase();
      const room = this.rooms.get(roomCode);

      if (!room) {
        return {
          success: false,
          error: 'Room not found'
        };
      }

      if (room.isExpired()) {
        this.removeRoom(roomCode);
        return {
          success: false,
          error: 'Room has expired'
        };
      }

      const joinResult = room.addPlayer(playerId, playerName, isSpectator);

      if (joinResult.success) {
        this.playerRooms.set(playerId, roomCode);
        console.log(`Player ${playerName} (${playerId}) joined room ${roomCode}`);
      }

      return {
        ...joinResult,
        room: this.getRoomInfo(roomCode)
      };
    } catch (error) {
      console.error('Error joining room:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove player from their current room
   * @param {string} playerId - Socket ID of player
   * @returns {Object} Leave result
   */
  leaveRoom(playerId) {
    try {
      const roomCode = this.playerRooms.get(playerId);
      if (!roomCode) {
        return { success: true, message: 'Player not in any room' };
      }

      const room = this.rooms.get(roomCode);
      if (!room) {
        this.playerRooms.delete(playerId);
        return { success: true, message: 'Room no longer exists' };
      }

      const leaveResult = room.removePlayer(playerId);
      this.playerRooms.delete(playerId);

      // Remove room if empty
      if (room.isEmpty()) {
        this.removeRoom(roomCode);
      }

      console.log(`Player ${playerId} left room ${roomCode}`);
      return {
        success: true,
        roomCode,
        ...leaveResult
      };
    } catch (error) {
      console.error('Error leaving room:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get room information
   * @param {string} roomCode - Room code
   * @returns {Object|null} Room information or null if not found
   */
  getRoomInfo(roomCode) {
    const room = this.rooms.get(roomCode.toUpperCase());
    return room ? room.getInfo() : null;
  }

  /**
   * Get room by player ID
   * @param {string} playerId - Socket ID of player
   * @returns {Room|null} Room object or null
   */
  getPlayerRoom(playerId) {
    const roomCode = this.playerRooms.get(playerId);
    return roomCode ? this.rooms.get(roomCode) : null;
  }

  /**
   * Remove a room completely
   * @param {string} roomCode - Room code to remove
   */
  removeRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (room) {
      // Remove all players from tracking
      [...room.players.keys(), ...room.spectators.keys()].forEach(playerId => {
        this.playerRooms.delete(playerId);
      });

      this.rooms.delete(roomCode);
      console.log(`Room ${roomCode} removed`);
    }
  }

  /**
   * Update room status
   * @param {string} roomCode - Room code
   * @param {string} status - New status
   */
  updateRoomStatus(roomCode, status) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (room) {
      room.status = status;
      console.log(`Room ${roomCode} status updated to: ${status}`);
    }
  }

  /**
   * Get all active rooms (for admin/monitoring)
   * @returns {Array} Array of room information
   */
  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => room.getInfo());
  }

  /**
   * Start cleanup interval for expired rooms
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupExpiredRooms();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up expired rooms
   */
  cleanupExpiredRooms() {
    const expiredRooms = [];

    for (const [roomCode, room] of this.rooms) {
      if (room.isExpired()) {
        expiredRooms.push(roomCode);
      }
    }

    expiredRooms.forEach(roomCode => {
      console.log(`Cleaning up expired room: ${roomCode}`);
      this.removeRoom(roomCode);
    });

    if (expiredRooms.length > 0) {
      console.log(`Cleaned up ${expiredRooms.length} expired rooms`);
    }
  }
}

/**
 * Room Class
 * Represents a single game room with players and game state
 */
class Room {
  constructor(code, creatorId, creatorName, gameSettings = {}) {
    this.code = code;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.expirationTime = 24 * 60 * 60 * 1000; // 24 hours

    /** @type {Map<string, Object>} */
    this.players = new Map();

    /** @type {Map<string, Object>} */
    this.spectators = new Map();

    this.maxPlayers = 2;
    this.gameSettings = {
      timeControl: gameSettings.timeControl || 'blitz',
      increment: gameSettings.increment || 5,
      initialTime: gameSettings.initialTime || 300000, // 5 minutes in ms
      ...gameSettings
    };

    this.gameState = null; // Will be set when game starts
    this.status = 'waiting'; // waiting, playing, finished

    // Add creator as first player
    this.addPlayer(creatorId, creatorName, false);
  }

  /**
   * Add player to room
   * @param {string} playerId - Socket ID
   * @param {string} playerName - Display name
   * @param {boolean} isSpectator - Whether joining as spectator
   * @returns {Object} Success/error result
   */
  addPlayer(playerId, playerName, isSpectator = false) {
    this.updateActivity();

    // Check if player is already in the room
    if (this.players.has(playerId)) {
      const existingPlayer = this.players.get(playerId);
      console.log(`Player ${playerName} (${playerId}) already in room ${this.code} as ${existingPlayer.color}`);
      return {
        success: true,
        role: 'player',
        color: existingPlayer.color,
        message: 'Already in room'
      };
    }

    if (this.spectators.has(playerId)) {
      console.log(`Player ${playerName} (${playerId}) already in room ${this.code} as spectator`);
      return {
        success: true,
        role: 'spectator',
        message: 'Already in room as spectator'
      };
    }

    if (isSpectator) {
      this.spectators.set(playerId, {
        id: playerId,
        name: playerName,
        joinedAt: new Date()
      });
      return { success: true, role: 'spectator' };
    }

    if (this.players.size >= this.maxPlayers) {
      // Add as spectator if room is full
      this.spectators.set(playerId, {
        id: playerId,
        name: playerName,
        joinedAt: new Date()
      });
      return { success: true, role: 'spectator', message: 'Room full, joined as spectator' };
    }

    // Determine player color
    const color = this.players.size === 0 ? 'white' : 'black';

    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      color: color,
      joinedAt: new Date(),
      ready: false
    });

    // Update room status to 'ready' when room is full
    if (this.players.size === this.maxPlayers) {
      this.status = 'ready';
    }

    return { success: true, role: 'player', color: color };
  }

  /**
   * Remove player from room
   * @param {string} playerId - Socket ID
   * @returns {Object} Removal result
   */
  removePlayer(playerId) {
    this.updateActivity();

    let wasPlayer = false;
    if (this.players.has(playerId)) {
      this.players.delete(playerId);
      wasPlayer = true;
    } else if (this.spectators.has(playerId)) {
      this.spectators.delete(playerId);
    }

    // If a player left during game, handle appropriately
    if (wasPlayer && this.status === 'playing') {
      this.status = 'abandoned';
    }

    return {
      success: true,
      wasPlayer,
      roomEmpty: this.isEmpty()
    };
  }

  /**
   * Check if room is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.players.size === 0 && this.spectators.size === 0;
  }

  /**
   * Check if room is expired
   * @returns {boolean}
   */
  isExpired() {
    return Date.now() - this.lastActivity.getTime() > this.expirationTime;
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    this.lastActivity = new Date();
  }

  /**
   * Get room information
   * @returns {Object} Room info object
   */
  getInfo() {
    return {
      code: this.code,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      status: this.status,
      gameSettings: this.gameSettings,
      players: Array.from(this.players.values()),
      spectators: Array.from(this.spectators.values()),
      playerCount: this.players.size,
      spectatorCount: this.spectators.size,
      maxPlayers: this.maxPlayers,
      isExpired: this.isExpired()
    };
  }
}

module.exports = RoomManager;