/**
 * Rate Limiter Utility
 * Advanced rate limiting for Chess v4 Backend
 * Provides different rate limits for different operations
 */

const { createError } = require('./errorHandler');
const logger = require('./logger');

class RateLimiter {
  constructor() {
    /** @type {Map<string, Object>} Rate limit data by key */
    this.limits = new Map();

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if action is allowed within rate limit
   * @param {string} key - Unique identifier (IP, user ID, etc.)
   * @param {Object} config - Rate limit configuration
   * @returns {Object} Rate limit result
   */
  checkLimit(key, config) {
    const now = Date.now();
    const windowMs = config.windowMs || 60000; // 1 minute default
    const maxRequests = config.maxRequests || 60; // 60 requests default

    // Get or create limit data
    let limitData = this.limits.get(key);
    if (!limitData) {
      limitData = {
        requests: [],
        createdAt: now
      };
      this.limits.set(key, limitData);
    }

    // Remove old requests outside the window
    limitData.requests = limitData.requests.filter(timestamp =>
      now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (limitData.requests.length >= maxRequests) {
      const oldestRequest = Math.min(...limitData.requests);
      const resetTime = oldestRequest + windowMs;

      logger.warn('Rate limit exceeded', {
        key,
        requests: limitData.requests.length,
        maxRequests,
        windowMs,
        resetTime: new Date(resetTime).toISOString()
      });

      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: resetTime - now
      };
    }

    // Add current request
    limitData.requests.push(now);

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - limitData.requests.length,
      resetTime: now + windowMs,
      retryAfter: 0
    };
  }

  /**
   * Create Express middleware for rate limiting
   * @param {Object} config - Rate limit configuration
   * @returns {Function} Express middleware
   */
  createMiddleware(config) {
    return (req, res, next) => {
      const key = config.keyGenerator ? config.keyGenerator(req) : req.ip;
      const result = this.checkLimit(key, config);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': result.limit,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      if (!result.allowed) {
        res.set('Retry-After', Math.ceil(result.retryAfter / 1000));
        return next(createError.rateLimit(
          config.message || 'Too many requests, please try again later'
        ));
      }

      next();
    };
  }

  /**
   * Create Socket.IO middleware for rate limiting
   * @param {Object} config - Rate limit configuration
   * @returns {Function} Socket.IO middleware
   */
  createSocketMiddleware(config) {
    return (socket, next) => {
      const key = config.keyGenerator ? config.keyGenerator(socket) : socket.handshake.address;
      const result = this.checkLimit(key, config);

      if (!result.allowed) {
        const error = new Error(config.message || 'Too many requests');
        error.data = {
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: result.retryAfter
        };
        return next(error);
      }

      next();
    };
  }

  /**
   * Check rate limit for specific operations
   * @param {string} operation - Operation type
   * @param {string} identifier - Unique identifier
   * @returns {boolean} Whether operation is allowed
   */
  checkOperation(operation, identifier) {
    const configs = {
      'room_create': {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 5 // 5 rooms per 5 minutes
      },
      'room_join': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10 // 10 joins per minute
      },
      'game_move': {
        windowMs: 10 * 1000, // 10 seconds
        maxRequests: 20 // 20 moves per 10 seconds (very generous)
      },
      'chat_message': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30 // 30 messages per minute
      },
      'matchmaking_join': {
        windowMs: 30 * 1000, // 30 seconds
        maxRequests: 10 // 10 matchmaking attempts per 30 seconds
      },
      'authentication': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10 // 10 auth attempts per 15 minutes
      }
    };

    const config = configs[operation];
    if (!config) {
      logger.warn('Unknown operation for rate limiting', { operation });
      return true; // Allow unknown operations
    }

    const key = `${operation}:${identifier}`;
    const result = this.checkLimit(key, config);

    if (!result.allowed) {
      logger.warn('Operation rate limited', {
        operation,
        identifier,
        remaining: result.remaining,
        resetTime: new Date(result.resetTime).toISOString()
      });
    }

    return result.allowed;
  }

  /**
   * Get current rate limit status
   * @param {string} key - Identifier
   * @param {Object} config - Rate limit configuration
   * @returns {Object} Current status
   */
  getStatus(key, config) {
    const limitData = this.limits.get(key);
    if (!limitData) {
      return {
        requests: 0,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      };
    }

    const now = Date.now();
    const validRequests = limitData.requests.filter(timestamp =>
      now - timestamp < config.windowMs
    );

    return {
      requests: validRequests.length,
      remaining: Math.max(0, config.maxRequests - validRequests.length),
      resetTime: validRequests.length > 0 ?
        Math.min(...validRequests) + config.windowMs :
        now + config.windowMs
    };
  }

  /**
   * Clear rate limit data for a key
   * @param {string} key - Identifier to clear
   */
  clear(key) {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll() {
    this.limits.clear();
  }

  /**
   * Start cleanup interval for old rate limit data
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up old rate limit data
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    let cleaned = 0;

    for (const [key, limitData] of this.limits) {
      // Remove if no recent requests
      if (now - limitData.createdAt > maxAge && limitData.requests.length === 0) {
        this.limits.delete(key);
        cleaned++;
      } else {
        // Clean old requests within the data
        const oldLength = limitData.requests.length;
        limitData.requests = limitData.requests.filter(timestamp =>
          now - timestamp < maxAge
        );

        // Update creation time if all requests were cleaned
        if (limitData.requests.length === 0 && oldLength > 0) {
          limitData.createdAt = now;
        }
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup completed', {
        cleanedEntries: cleaned,
        remainingEntries: this.limits.size
      });
    }
  }

  /**
   * Get statistics about rate limiting
   * @returns {Object} Statistics
   */
  getStats() {
    const now = Date.now();
    let totalActiveRequests = 0;
    let totalKeys = this.limits.size;
    let activeKeys = 0;

    for (const [key, limitData] of this.limits) {
      const activeRequests = limitData.requests.filter(timestamp =>
        now - timestamp < 60000 // Last minute
      ).length;

      if (activeRequests > 0) {
        activeKeys++;
        totalActiveRequests += activeRequests;
      }
    }

    return {
      totalKeys,
      activeKeys,
      totalActiveRequests,
      averageRequestsPerActiveKey: activeKeys > 0 ?
        Math.round(totalActiveRequests / activeKeys * 100) / 100 : 0
    };
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Predefined rate limiters for common use cases
const rateLimiters = {
  // General API rate limiting
  api: rateLimiter.createMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req) => req.ip,
    message: 'Too many API requests, please try again later'
  }),

  // Room creation rate limiting
  roomCreation: rateLimiter.createMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5,
    keyGenerator: (req) => req.ip,
    message: 'Too many rooms created, please wait before creating another'
  }),

  // Authentication rate limiting
  auth: rateLimiter.createMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    keyGenerator: (req) => req.ip,
    message: 'Too many authentication attempts, please try again later'
  }),

  // Socket connection rate limiting
  socket: rateLimiter.createSocketMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (socket) => socket.handshake.address,
    message: 'Too many connection attempts'
  })
};

module.exports = {
  RateLimiter,
  rateLimiter,
  rateLimiters
};