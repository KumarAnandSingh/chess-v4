/**
 * Authentication Middleware
 * Handles user session management and authentication for Chess v4
 * Provides simple user identification and session tracking
 */

const { v4: uuidv4 } = require('uuid');

class AuthManager {
  constructor() {
    /** @type {Map<string, Object>} Map of sessionId to user data */
    this.sessions = new Map();

    /** @type {Map<string, string>} Map of socketId to sessionId */
    this.socketSessions = new Map();

    // Start cleanup interval for expired sessions
    this.startSessionCleanup();
  }

  /**
   * Create or retrieve user session
   * @param {string} username - User's display name
   * @param {string} socketId - Socket connection ID
   * @param {Object} additionalData - Additional user data
   * @returns {Object} Session information
   */
  createSession(username, socketId, additionalData = {}) {
    try {
      // Check if user already has an active session
      let existingSession = null;
      for (const [sessionId, session] of this.sessions) {
        if (session.username === username && session.isActive) {
          existingSession = { sessionId, ...session };
          break;
        }
      }

      if (existingSession) {
        // Update existing session with new socket
        existingSession.socketId = socketId;
        existingSession.lastActivity = new Date();
        existingSession.connectionCount = (existingSession.connectionCount || 0) + 1;

        this.sessions.set(existingSession.sessionId, existingSession);
        this.socketSessions.set(socketId, existingSession.sessionId);

        console.log(`User ${username} reconnected with session ${existingSession.sessionId}`);

        return {
          success: true,
          session: existingSession,
          isReconnection: true
        };
      }

      // Create new session
      const sessionId = uuidv4();
      const session = {
        sessionId,
        username,
        socketId,
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true,
        rating: additionalData.rating || 1200,
        gamesPlayed: additionalData.gamesPlayed || 0,
        preferences: {
          timeControl: 'blitz',
          autoQueen: true,
          showCoordinates: true,
          playSound: true,
          ...additionalData.preferences
        },
        connectionCount: 1
      };

      this.sessions.set(sessionId, session);
      this.socketSessions.set(socketId, sessionId);

      console.log(`New session created for ${username}: ${sessionId}`);

      return {
        success: true,
        session,
        isReconnection: false
      };

    } catch (error) {
      console.error('Error creating session:', error);
      return {
        success: false,
        error: 'Failed to create session'
      };
    }
  }

  /**
   * Get session by socket ID
   * @param {string} socketId - Socket connection ID
   * @returns {Object|null} Session data or null
   */
  getSessionBySocket(socketId) {
    const sessionId = this.socketSessions.get(socketId);
    return sessionId ? this.sessions.get(sessionId) : null;
  }

  /**
   * Get session by session ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session data or null
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session activity
   * @param {string} socketId - Socket connection ID
   */
  updateActivity(socketId) {
    const session = this.getSessionBySocket(socketId);
    if (session) {
      session.lastActivity = new Date();
      this.sessions.set(session.sessionId, session);
    }
  }

  /**
   * Update user preferences
   * @param {string} socketId - Socket connection ID
   * @param {Object} preferences - User preferences to update
   * @returns {Object} Update result
   */
  updatePreferences(socketId, preferences) {
    const session = this.getSessionBySocket(socketId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    session.preferences = {
      ...session.preferences,
      ...preferences
    };
    session.lastActivity = new Date();

    this.sessions.set(session.sessionId, session);

    return {
      success: true,
      preferences: session.preferences
    };
  }

  /**
   * Update user rating after game
   * @param {string} sessionId - Session ID
   * @param {number} newRating - New rating value
   * @param {string} gameResult - Game result (win, loss, draw)
   */
  updateRating(sessionId, newRating, gameResult) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.rating = newRating;
      session.gamesPlayed = (session.gamesPlayed || 0) + 1;
      session.lastGameResult = gameResult;
      session.lastActivity = new Date();

      this.sessions.set(sessionId, session);

      console.log(`Rating updated for ${session.username}: ${newRating} (${gameResult})`);
    }
  }

  /**
   * Handle user disconnect
   * @param {string} socketId - Socket connection ID
   * @returns {Object} Disconnect result
   */
  handleDisconnect(socketId) {
    const session = this.getSessionBySocket(socketId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    // Mark session as inactive but keep it for potential reconnection
    session.isActive = false;
    session.lastActivity = new Date();
    session.disconnectedAt = new Date();

    this.sessions.set(session.sessionId, session);
    this.socketSessions.delete(socketId);

    console.log(`User ${session.username} disconnected (session ${session.sessionId})`);

    return {
      success: true,
      session,
      username: session.username
    };
  }

  /**
   * Validate session for API requests
   * @param {string} sessionId - Session ID from request
   * @returns {Object} Validation result
   */
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        valid: false,
        error: 'Session not found'
      };
    }

    // Check if session is expired (24 hours)
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - session.lastActivity.getTime() > expirationTime) {
      this.sessions.delete(sessionId);
      return {
        valid: false,
        error: 'Session expired'
      };
    }

    return {
      valid: true,
      session
    };
  }

  /**
   * Get all active sessions (for monitoring)
   * @returns {Array} Array of active sessions
   */
  getActiveSessions() {
    return Array.from(this.sessions.values())
      .filter(session => session.isActive)
      .map(session => ({
        sessionId: session.sessionId,
        username: session.username,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        rating: session.rating,
        gamesPlayed: session.gamesPlayed
      }));
  }

  /**
   * Get user statistics
   * @param {string} sessionId - Session ID
   * @returns {Object} User statistics
   */
  getUserStats(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      username: session.username,
      rating: session.rating,
      gamesPlayed: session.gamesPlayed,
      createdAt: session.createdAt,
      preferences: session.preferences,
      connectionCount: session.connectionCount
    };
  }

  /**
   * Start session cleanup interval
   */
  startSessionCleanup() {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > expirationTime) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      const session = this.sessions.get(sessionId);
      if (session) {
        console.log(`Cleaning up expired session: ${session.username} (${sessionId})`);
        this.sessions.delete(sessionId);
        // Clean up socket mapping if exists
        for (const [socketId, mappedSessionId] of this.socketSessions) {
          if (mappedSessionId === sessionId) {
            this.socketSessions.delete(socketId);
          }
        }
      }
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
}

/**
 * Express middleware for session validation
 * @param {AuthManager} authManager - Auth manager instance
 * @returns {Function} Express middleware function
 */
function sessionMiddleware(authManager) {
  return (req, res, next) => {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Session ID required'
      });
    }

    const validation = authManager.validateSession(sessionId);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: validation.error
      });
    }

    // Add session to request object
    req.session = validation.session;
    next();
  };
}

/**
 * Socket.IO middleware for authentication
 * @param {AuthManager} authManager - Auth manager instance
 * @returns {Function} Socket.IO middleware function
 */
function socketAuthMiddleware(authManager) {
  return (socket, next) => {
    const { username, sessionId } = socket.handshake.auth;

    if (!username) {
      return next(new Error('Username required'));
    }

    // Create or retrieve session
    const result = authManager.createSession(username, socket.id, {
      rating: socket.handshake.auth.rating,
      preferences: socket.handshake.auth.preferences
    });

    if (!result.success) {
      return next(new Error(result.error));
    }

    // Attach session to socket
    socket.session = result.session;
    socket.isReconnection = result.isReconnection;

    next();
  };
}

module.exports = {
  AuthManager,
  sessionMiddleware,
  socketAuthMiddleware
};