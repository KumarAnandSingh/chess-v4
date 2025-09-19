/**
 * Error Handler Utility
 * Centralized error handling for Chess v4 Backend
 * Provides consistent error responses and logging
 */

const logger = require('./logger');

class ErrorHandler extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error types
 */
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  GAME_ERROR: 'GAME_ERROR',
  ROOM_ERROR: 'ROOM_ERROR',
  SOCKET_ERROR: 'SOCKET_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/**
 * Create specific error types
 */
const createError = {
  validation: (message) => new ErrorHandler(message, 400, ErrorTypes.VALIDATION_ERROR),
  authentication: (message) => new ErrorHandler(message, 401, ErrorTypes.AUTHENTICATION_ERROR),
  authorization: (message) => new ErrorHandler(message, 403, ErrorTypes.AUTHORIZATION_ERROR),
  notFound: (message) => new ErrorHandler(message, 404, ErrorTypes.NOT_FOUND),
  conflict: (message) => new ErrorHandler(message, 409, ErrorTypes.CONFLICT),
  rateLimit: (message) => new ErrorHandler(message, 429, ErrorTypes.RATE_LIMIT),
  game: (message) => new ErrorHandler(message, 400, ErrorTypes.GAME_ERROR),
  room: (message) => new ErrorHandler(message, 400, ErrorTypes.ROOM_ERROR),
  socket: (message) => new ErrorHandler(message, 500, ErrorTypes.SOCKET_ERROR),
  internal: (message) => new ErrorHandler(message, 500, ErrorTypes.INTERNAL_ERROR)
};

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function expressErrorHandler(err, req, res, next) {
  // Log error
  logger.error('Express Error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Default error response
  let statusCode = 500;
  let code = ErrorTypes.INTERNAL_ERROR;
  let message = 'Internal server error';

  // Handle known error types
  if (err instanceof ErrorHandler) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = ErrorTypes.VALIDATION_ERROR;
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = ErrorTypes.VALIDATION_ERROR;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    code = ErrorTypes.CONFLICT;
    message = 'Duplicate entry';
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Socket.IO error handler
 * @param {Object} socket - Socket.IO socket
 * @param {Error} error - Error object
 * @param {string} event - Event that caused error
 * @param {Object} data - Event data
 */
function socketErrorHandler(socket, error, event, data = {}) {
  logger.error('Socket Error', {
    socketId: socket.id,
    event,
    message: error.message,
    stack: error.stack,
    data
  });

  // Send error to client
  socket.emit('error', {
    event,
    error: {
      code: error.code || ErrorTypes.SOCKET_ERROR,
      message: error.message,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Async wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation helper functions
 */
const validate = {
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      throw createError.validation(`${fieldName} is required`);
    }
    return value;
  },

  string: (value, fieldName, maxLength = 255) => {
    if (typeof value !== 'string') {
      throw createError.validation(`${fieldName} must be a string`);
    }
    if (value.length > maxLength) {
      throw createError.validation(`${fieldName} must be less than ${maxLength} characters`);
    }
    return value.trim();
  },

  number: (value, fieldName, min = null, max = null) => {
    const num = Number(value);
    if (isNaN(num)) {
      throw createError.validation(`${fieldName} must be a number`);
    }
    if (min !== null && num < min) {
      throw createError.validation(`${fieldName} must be at least ${min}`);
    }
    if (max !== null && num > max) {
      throw createError.validation(`${fieldName} must be at most ${max}`);
    }
    return num;
  },

  boolean: (value, fieldName) => {
    if (typeof value !== 'boolean') {
      throw createError.validation(`${fieldName} must be a boolean`);
    }
    return value;
  },

  array: (value, fieldName, maxLength = null) => {
    if (!Array.isArray(value)) {
      throw createError.validation(`${fieldName} must be an array`);
    }
    if (maxLength !== null && value.length > maxLength) {
      throw createError.validation(`${fieldName} can have at most ${maxLength} items`);
    }
    return value;
  },

  enum: (value, fieldName, allowedValues) => {
    if (!allowedValues.includes(value)) {
      throw createError.validation(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
    return value;
  },

  roomCode: (value) => {
    const cleaned = validate.string(value, 'Room code', 4).toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}$/.test(cleaned)) {
      throw createError.validation('Room code must be 2 letters followed by 2 numbers (e.g., AB12)');
    }
    return cleaned;
  },

  username: (value) => {
    const cleaned = validate.string(value, 'Username', 20);
    if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
      throw createError.validation('Username can only contain letters, numbers, underscores, and hyphens');
    }
    return cleaned;
  },

  timeControl: (value) => {
    return validate.enum(value, 'Time control', ['bullet', 'blitz', 'rapid', 'classical']);
  }
};

/**
 * Game-specific validation
 */
const gameValidation = {
  chessMove: (from, to, promotion = null) => {
    if (!/^[a-h][1-8]$/.test(from)) {
      throw createError.game('Invalid source square');
    }
    if (!/^[a-h][1-8]$/.test(to)) {
      throw createError.game('Invalid target square');
    }
    if (promotion && !/^[qrbn]$/.test(promotion)) {
      throw createError.game('Invalid promotion piece');
    }
    return { from, to, promotion };
  },

  gameSettings: (settings) => {
    const validated = {};

    if (settings.timeControl) {
      validated.timeControl = validate.timeControl(settings.timeControl);
    }

    if (settings.initialTime !== undefined) {
      validated.initialTime = validate.number(settings.initialTime, 'Initial time', 30000, 7200000); // 30s to 2h
    }

    if (settings.increment !== undefined) {
      validated.increment = validate.number(settings.increment, 'Increment', 0, 300000); // 0 to 5m
    }

    if (settings.rated !== undefined) {
      validated.rated = validate.boolean(settings.rated, 'Rated');
    }

    return validated;
  }
};

/**
 * Performance monitoring wrapper
 * @param {string} operation - Operation name
 * @param {Function} fn - Function to monitor
 * @returns {Function} Wrapped function
 */
function performanceMonitor(operation) {
  return function(fn) {
    return async function(...args) {
      const start = Date.now();
      try {
        const result = await fn.apply(this, args);
        const duration = Date.now() - start;
        logger.performance(operation, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.performance(`${operation} (error)`, duration, { error: error.message });
        throw error;
      }
    };
  };
}

module.exports = {
  ErrorHandler,
  ErrorTypes,
  createError,
  expressErrorHandler,
  socketErrorHandler,
  asyncHandler,
  validate,
  gameValidation,
  performanceMonitor
};