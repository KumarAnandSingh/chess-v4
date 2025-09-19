/**
 * GameState Model
 * Manages chess game logic, validation, and state using chess.js
 * Handles time controls, move validation, and game completion
 */

const { Chess } = require('chess.js');

class GameState {
  constructor(gameSettings = {}, players = []) {
    /** @type {Chess} Chess.js instance for game logic */
    this.chess = new Chess();

    /** @type {string} Unique game identifier */
    this.gameId = this.generateGameId();

    /** @type {Date} Game start timestamp */
    this.startTime = new Date();

    /** @type {Date} Last move timestamp */
    this.lastMoveTime = new Date();

    /** @type {Object} Game configuration */
    this.settings = {
      timeControl: gameSettings.timeControl || 'blitz',
      initialTime: gameSettings.initialTime || 300000, // 5 minutes in ms
      increment: gameSettings.increment || 5000, // 5 seconds in ms
      rated: gameSettings.rated || false,
      ...gameSettings
    };

    /** @type {Array} Player information */
    this.players = players.map((player, index) => ({
      ...player,
      color: index === 0 ? 'white' : 'black',
      timeRemaining: this.settings.initialTime,
      connected: true
    }));

    /** @type {Array} Move history with timestamps */
    this.moveHistory = [];

    /** @type {Array} Chat messages */
    this.chatHistory = [];

    /** @type {string} Current game status */
    this.status = 'waiting'; // waiting, playing, paused, finished

    /** @type {string|null} Game result */
    this.result = null; // white, black, draw, abandoned

    /** @type {string|null} Reason for game end */
    this.endReason = null;

    /** @type {Object|null} Timer intervals */
    this.timers = {
      white: null,
      black: null
    };

    console.log(`New game created: ${this.gameId}`);
  }

  /**
   * Generate unique game ID
   * @returns {string} Unique identifier
   */
  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the game
   * @returns {Object} Start result
   */
  startGame() {
    if (this.players.length !== 2) {
      return {
        success: false,
        error: 'Need exactly 2 players to start'
      };
    }

    this.status = 'playing';
    this.startTime = new Date();
    this.lastMoveTime = new Date();

    // Start timer for white (first to move)
    this.startTimer('white');

    console.log(`Game ${this.gameId} started`);

    return {
      success: true,
      gameState: this.getGameState()
    };
  }

  /**
   * Make a chess move
   * @param {string} playerId - Player making the move
   * @param {string} from - Source square (e.g., 'e2')
   * @param {string} to - Target square (e.g., 'e4')
   * @param {string} promotion - Promotion piece (if any)
   * @returns {Object} Move result
   */
  makeMove(playerId, from, to, promotion = null) {
    try {
      if (this.status !== 'playing') {
        return {
          success: false,
          error: 'Game is not in playing state'
        };
      }

      const player = this.players.find(p => p.id === playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found in this game'
        };
      }

      // Check if it's player's turn
      const currentTurn = this.chess.turn();
      if ((currentTurn === 'w' && player.color !== 'white') ||
          (currentTurn === 'b' && player.color !== 'black')) {
        return {
          success: false,
          error: 'Not your turn'
        };
      }

      // Attempt the move
      const moveOptions = { from, to };
      if (promotion) {
        moveOptions.promotion = promotion;
      }

      const move = this.chess.move(moveOptions);
      if (!move) {
        return {
          success: false,
          error: 'Invalid move'
        };
      }

      const moveTime = new Date();
      const timeTaken = moveTime.getTime() - this.lastMoveTime.getTime();

      // Update time remaining
      this.updatePlayerTime(player.color, timeTaken);

      // Stop current timer and start opponent's timer
      this.stopTimer(player.color);
      const opponentColor = player.color === 'white' ? 'black' : 'white';
      this.startTimer(opponentColor);

      // Record move in history
      this.moveHistory.push({
        move: move,
        player: player,
        timestamp: moveTime,
        timeTaken: timeTaken,
        timeRemaining: player.timeRemaining,
        fen: this.chess.fen()
      });

      this.lastMoveTime = moveTime;

      // Check for game end conditions
      this.checkGameEnd();

      console.log(`Move made in game ${this.gameId}: ${move.san} by ${player.name}`);

      return {
        success: true,
        move: move,
        gameState: this.getGameState()
      };

    } catch (error) {
      console.error('Error making move:', error);
      return {
        success: false,
        error: 'Failed to make move'
      };
    }
  }

  /**
   * Handle player resignation
   * @param {string} playerId - Player who resigned
   * @returns {Object} Resignation result
   */
  resign(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    this.status = 'finished';
    this.result = player.color === 'white' ? 'black' : 'white';
    this.endReason = 'resignation';

    this.stopAllTimers();

    console.log(`Player ${player.name} resigned in game ${this.gameId}`);

    return {
      success: true,
      result: this.result,
      endReason: this.endReason,
      gameState: this.getGameState()
    };
  }

  /**
   * Handle draw offer/acceptance
   * @param {string} playerId - Player offering/accepting draw
   * @param {string} action - 'offer' or 'accept'
   * @returns {Object} Draw result
   */
  handleDraw(playerId, action) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    if (action === 'offer') {
      player.drawOffered = true;
      return {
        success: true,
        message: 'Draw offered',
        gameState: this.getGameState()
      };
    }

    if (action === 'accept') {
      const opponent = this.players.find(p => p.id !== playerId);
      if (!opponent || !opponent.drawOffered) {
        return {
          success: false,
          error: 'No draw offer to accept'
        };
      }

      this.status = 'finished';
      this.result = 'draw';
      this.endReason = 'mutual agreement';

      this.stopAllTimers();

      return {
        success: true,
        result: this.result,
        endReason: this.endReason,
        gameState: this.getGameState()
      };
    }

    return {
      success: false,
      error: 'Invalid draw action'
    };
  }

  /**
   * Add chat message
   * @param {string} playerId - Player sending message
   * @param {string} message - Message content
   * @param {string} type - Message type ('chat', 'system', 'quick')
   * @returns {Object} Chat result
   */
  addChatMessage(playerId, message, type = 'chat') {
    const player = this.players.find(p => p.id === playerId);
    if (!player && type !== 'system') {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    const chatMessage = {
      id: Date.now().toString(),
      playerId: playerId,
      playerName: player ? player.name : 'System',
      message: message,
      type: type,
      timestamp: new Date()
    };

    this.chatHistory.push(chatMessage);

    // Limit chat history to last 50 messages
    if (this.chatHistory.length > 50) {
      this.chatHistory = this.chatHistory.slice(-50);
    }

    return {
      success: true,
      message: chatMessage
    };
  }

  /**
   * Update player connection status
   * @param {string} playerId - Player ID
   * @param {boolean} connected - Connection status
   */
  updatePlayerConnection(playerId, connected) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.connected = connected;
      if (!connected && this.status === 'playing') {
        // Pause timers when player disconnects
        this.pauseTimers();
      } else if (connected && this.status === 'playing') {
        // Resume timers when player reconnects
        this.resumeTimers();
      }
    }
  }

  /**
   * Start timer for specified color
   * @param {string} color - 'white' or 'black'
   */
  startTimer(color) {
    if (this.timers[color]) {
      clearInterval(this.timers[color]);
    }

    this.timers[color] = setInterval(() => {
      const player = this.players.find(p => p.color === color);
      if (player && player.timeRemaining > 0) {
        player.timeRemaining -= 100; // Decrease by 100ms

        if (player.timeRemaining <= 0) {
          player.timeRemaining = 0;
          this.handleTimeOut(color);
        }
      }
    }, 100); // Update every 100ms for smooth timer
  }

  /**
   * Stop timer for specified color
   * @param {string} color - 'white' or 'black'
   */
  stopTimer(color) {
    if (this.timers[color]) {
      clearInterval(this.timers[color]);
      this.timers[color] = null;
    }
  }

  /**
   * Stop all timers
   */
  stopAllTimers() {
    this.stopTimer('white');
    this.stopTimer('black');
  }

  /**
   * Pause all active timers
   */
  pauseTimers() {
    this.stopAllTimers();
    this.status = 'paused';
  }

  /**
   * Resume timers
   */
  resumeTimers() {
    if (this.status === 'paused') {
      this.status = 'playing';
      const currentTurn = this.chess.turn();
      const activeColor = currentTurn === 'w' ? 'white' : 'black';
      this.startTimer(activeColor);
    }
  }

  /**
   * Handle timeout for a player
   * @param {string} color - Color that timed out
   */
  handleTimeOut(color) {
    this.status = 'finished';
    this.result = color === 'white' ? 'black' : 'white';
    this.endReason = 'timeout';
    this.stopAllTimers();

    console.log(`Time out in game ${this.gameId}: ${color} lost on time`);
  }

  /**
   * Update player time remaining
   * @param {string} color - Player color
   * @param {number} timeTaken - Time taken for move in ms
   */
  updatePlayerTime(color, timeTaken) {
    const player = this.players.find(p => p.color === color);
    if (player) {
      player.timeRemaining -= timeTaken;
      player.timeRemaining += this.settings.increment; // Add increment
      player.timeRemaining = Math.max(0, player.timeRemaining);
    }
  }

  /**
   * Check for game end conditions
   */
  checkGameEnd() {
    if (this.chess.isGameOver()) {
      this.status = 'finished';
      this.stopAllTimers();

      if (this.chess.isCheckmate()) {
        const winner = this.chess.turn() === 'w' ? 'black' : 'white';
        this.result = winner;
        this.endReason = 'checkmate';
      } else if (this.chess.isStalemate()) {
        this.result = 'draw';
        this.endReason = 'stalemate';
      } else if (this.chess.isThreefoldRepetition()) {
        this.result = 'draw';
        this.endReason = 'repetition';
      } else if (this.chess.isInsufficientMaterial()) {
        this.result = 'draw';
        this.endReason = 'insufficient material';
      } else if (this.chess.isDraw()) {
        this.result = 'draw';
        this.endReason = '50-move rule';
      }

      console.log(`Game ${this.gameId} ended: ${this.result} by ${this.endReason}`);
    }
  }

  /**
   * Get complete game state
   * @returns {Object} Complete game state object
   */
  getGameState() {
    return {
      gameId: this.gameId,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      turn: this.chess.turn(),
      status: this.status,
      result: this.result,
      endReason: this.endReason,
      settings: this.settings,
      players: this.players,
      moveHistory: this.moveHistory,
      chatHistory: this.chatHistory.slice(-20), // Last 20 messages
      startTime: this.startTime,
      lastMoveTime: this.lastMoveTime,
      legalMoves: this.status === 'playing' ? this.chess.moves({ verbose: true }) : [],
      inCheck: this.chess.inCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw()
    };
  }

  /**
   * Get lightweight game state for updates
   * @returns {Object} Essential game state information
   */
  getLightGameState() {
    return {
      gameId: this.gameId,
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      status: this.status,
      result: this.result,
      endReason: this.endReason,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        timeRemaining: p.timeRemaining,
        connected: p.connected
      })),
      lastMove: this.moveHistory[this.moveHistory.length - 1] || null
    };
  }

  /**
   * Restore game from saved state (for reconnection)
   * @param {Object} savedState - Previously saved game state
   */
  restoreFromState(savedState) {
    try {
      this.chess.load(savedState.fen);
      this.gameId = savedState.gameId;
      this.status = savedState.status;
      this.result = savedState.result;
      this.endReason = savedState.endReason;
      this.players = savedState.players;
      this.moveHistory = savedState.moveHistory;
      this.chatHistory = savedState.chatHistory;
      this.settings = savedState.settings;
      this.startTime = new Date(savedState.startTime);
      this.lastMoveTime = new Date(savedState.lastMoveTime);

      console.log(`Game ${this.gameId} restored from saved state`);
    } catch (error) {
      console.error('Error restoring game state:', error);
      throw new Error('Failed to restore game state');
    }
  }
}

module.exports = GameState;