/**
 * Logger Utility
 * Centralized logging for Chess v4 Backend
 * Provides structured logging with different levels and formatting
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enableFileLogging = process.env.NODE_ENV === 'production';
    this.logFile = process.env.LOG_FILE || 'logs/chess-v4.log';

    // Create logs directory if it doesn't exist
    if (this.enableFileLogging) {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this.currentLevel = this.levels[this.logLevel] || this.levels.info;
  }

  /**
   * Format log message with timestamp and context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  /**
   * Write log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  log(level, message, context = {}) {
    const levelNum = this.levels[level];
    if (levelNum === undefined || levelNum > this.currentLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    // Console output
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // File output (production only)
    if (this.enableFileLogging) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  /**
   * Log error messages
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   */
  error(message, context = {}) {
    this.log('error', message, context);
  }

  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  /**
   * Log info messages
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    this.log('info', message, context);
  }

  /**
   * Log debug messages
   * @param {string} message - Debug message
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    this.log('debug', message, context);
  }

  /**
   * Log game events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  gameEvent(event, data = {}) {
    this.info(`Game Event: ${event}`, data);
  }

  /**
   * Log user actions
   * @param {string} action - Action type
   * @param {string} userId - User ID
   * @param {Object} data - Action data
   */
  userAction(action, userId, data = {}) {
    this.info(`User Action: ${action}`, { userId, ...data });
  }

  /**
   * Log room events
   * @param {string} event - Event type
   * @param {string} roomCode - Room code
   * @param {Object} data - Event data
   */
  roomEvent(event, roomCode, data = {}) {
    this.info(`Room Event: ${event}`, { roomCode, ...data });
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} data - Additional data
   */
  performance(operation, duration, data = {}) {
    this.info(`Performance: ${operation}`, { duration, ...data });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;