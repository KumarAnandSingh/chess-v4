/**
 * Room API Routes
 * REST endpoints for room management in Chess v4
 * Handles room creation, joining, and information retrieval
 */

const express = require('express');
const router = express.Router();

/**
 * Initialize room routes with dependencies
 * @param {RoomManager} roomManager - Room manager instance
 * @param {AuthManager} authManager - Auth manager instance
 * @returns {express.Router} Configured router
 */
function createRoomRoutes(roomManager, authManager) {
  /**
   * POST /api/rooms/create
   * Create a new room with invitation code
   */
  router.post('/create', (req, res) => {
    try {
      const { username, gameSettings } = req.body;

      // Validate request
      if (!username || !username.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Username is required'
        });
      }

      // Sanitize username
      const sanitizedUsername = username.trim().substring(0, 20);

      // Generate temporary player ID for room creation
      const tempPlayerId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Validate game settings
      const validTimeControls = ['bullet', 'blitz', 'rapid', 'classical'];
      const settings = {
        timeControl: gameSettings?.timeControl || 'blitz',
        initialTime: gameSettings?.initialTime || 300000, // 5 minutes
        increment: gameSettings?.increment || 5000, // 5 seconds
        rated: Boolean(gameSettings?.rated),
        ...gameSettings
      };

      if (!validTimeControls.includes(settings.timeControl)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time control'
        });
      }

      // Create room
      const result = roomManager.createRoom(tempPlayerId, sanitizedUsername, settings);

      if (!result.success) {
        return res.status(500).json(result);
      }

      console.log(`Room created via API: ${result.roomCode} by ${sanitizedUsername}`);

      res.json({
        success: true,
        roomCode: result.roomCode,
        room: result.room,
        tempPlayerId: tempPlayerId // Frontend needs this to establish socket connection
      });

    } catch (error) {
      console.error('Error in POST /api/rooms/create:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/rooms/join
   * Join an existing room with code
   */
  router.post('/join', (req, res) => {
    try {
      const { roomCode, username, isSpectator } = req.body;

      // Validate request
      if (!roomCode || !roomCode.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Room code is required'
        });
      }

      if (!username || !username.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Username is required'
        });
      }

      // Sanitize inputs
      const sanitizedRoomCode = roomCode.trim().toUpperCase();
      const sanitizedUsername = username.trim().substring(0, 20);

      // Generate temporary player ID for joining
      const tempPlayerId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Attempt to join room
      const result = roomManager.joinRoom(
        sanitizedRoomCode,
        tempPlayerId,
        sanitizedUsername,
        Boolean(isSpectator)
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log(`Player joined room via API: ${sanitizedUsername} -> ${sanitizedRoomCode}`);

      res.json({
        success: true,
        roomCode: sanitizedRoomCode,
        room: result.room,
        role: result.role,
        color: result.color,
        tempPlayerId: tempPlayerId // Frontend needs this to establish socket connection
      });

    } catch (error) {
      console.error('Error in POST /api/rooms/join:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * GET /api/rooms/:code
   * Get room information
   */
  router.get('/:code', (req, res) => {
    try {
      const roomCode = req.params.code.trim().toUpperCase();

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          error: 'Room code is required'
        });
      }

      const roomInfo = roomManager.getRoomInfo(roomCode);

      if (!roomInfo) {
        return res.status(404).json({
          success: false,
          error: 'Room not found'
        });
      }

      // Check if room is expired
      if (roomInfo.isExpired) {
        roomManager.removeRoom(roomCode);
        return res.status(404).json({
          success: false,
          error: 'Room has expired'
        });
      }

      res.json({
        success: true,
        room: roomInfo
      });

    } catch (error) {
      console.error('Error in GET /api/rooms/:code:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * GET /api/rooms
   * Get all active rooms (for monitoring/admin)
   */
  router.get('/', (req, res) => {
    try {
      const rooms = roomManager.getAllRooms();

      // Filter out expired rooms
      const activeRooms = rooms.filter(room => !room.isExpired);

      res.json({
        success: true,
        rooms: activeRooms,
        totalCount: activeRooms.length
      });

    } catch (error) {
      console.error('Error in GET /api/rooms:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * DELETE /api/rooms/:code
   * Delete/close a room (creator only)
   */
  router.delete('/:code', (req, res) => {
    try {
      const roomCode = req.params.code.trim().toUpperCase();
      const { creatorId } = req.body;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          error: 'Room code is required'
        });
      }

      const roomInfo = roomManager.getRoomInfo(roomCode);

      if (!roomInfo) {
        return res.status(404).json({
          success: false,
          error: 'Room not found'
        });
      }

      // Check if requester is the creator
      const creator = roomInfo.players.find(player => player.id === creatorId);
      if (!creator || roomInfo.players.indexOf(creator) !== 0) {
        return res.status(403).json({
          success: false,
          error: 'Only room creator can delete room'
        });
      }

      // Remove room
      roomManager.removeRoom(roomCode);

      console.log(`Room deleted via API: ${roomCode} by creator`);

      res.json({
        success: true,
        message: 'Room deleted successfully'
      });

    } catch (error) {
      console.error('Error in DELETE /api/rooms/:code:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/rooms/:code/settings
   * Update room settings (creator only, before game starts)
   */
  router.post('/:code/settings', (req, res) => {
    try {
      const roomCode = req.params.code.trim().toUpperCase();
      const { creatorId, gameSettings } = req.body;

      if (!roomCode) {
        return res.status(400).json({
          success: false,
          error: 'Room code is required'
        });
      }

      const room = roomManager.getPlayerRoom(creatorId);

      if (!room || room.code !== roomCode) {
        return res.status(404).json({
          success: false,
          error: 'Room not found or access denied'
        });
      }

      // Check if requester is the creator
      const creator = room.players.get(creatorId);
      if (!creator || Array.from(room.players.keys())[0] !== creatorId) {
        return res.status(403).json({
          success: false,
          error: 'Only room creator can update settings'
        });
      }

      // Check if game hasn't started
      if (room.status !== 'waiting') {
        return res.status(400).json({
          success: false,
          error: 'Cannot update settings after game starts'
        });
      }

      // Validate and update settings
      const validTimeControls = ['bullet', 'blitz', 'rapid', 'classical'];
      if (gameSettings.timeControl && !validTimeControls.includes(gameSettings.timeControl)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time control'
        });
      }

      // Update room settings
      Object.assign(room.gameSettings, gameSettings);

      res.json({
        success: true,
        room: room.getInfo()
      });

    } catch (error) {
      console.error('Error in POST /api/rooms/:code/settings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  return router;
}

module.exports = createRoomRoutes;