# Chess v4 Backend

A comprehensive multiplayer chess server that combines the best features from Chess v0 and v3 while adding a new room invitation system. Built with Node.js, Express, Socket.IO, and chess.js.

## 🚀 Features

### Room Management System
- **4-digit alphanumeric room codes** (e.g., "AB12", "XY99")
- **Private rooms** with invitation codes
- **Room expiration** (24 hours)
- **Capacity management** (max 2 players + unlimited spectators)
- **Real-time room updates**

### Core Chess Features
- **Real-time multiplayer** with Socket.IO
- **Chess game logic** with chess.js validation
- **Multiple time controls** (Bullet, Blitz, Rapid, Classical)
- **Matchmaking system** for random games
- **Chat system** with quick messages
- **Spectator mode** support
- **Game state persistence**
- **Player authentication** and ratings

### Enhanced Features
- **Reconnection handling** for network issues
- **Game state recovery** after disconnection
- **Comprehensive error handling**
- **Rate limiting** for security
- **Health monitoring** endpoints
- **Performance logging**
- **CORS configuration** for production

## 📁 Project Structure

```
backend/
├── models/
│   └── GameState.js          # Chess game logic and state management
├── services/
│   └── RoomManager.js        # Room creation and management
├── middleware/
│   └── auth.js              # Authentication and session management
├── routes/
│   └── rooms.js             # Room API endpoints
├── utils/
│   ├── logger.js            # Centralized logging
│   ├── errorHandler.js      # Error handling utilities
│   └── rateLimiter.js       # Rate limiting utilities
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
├── .env.example             # Environment configuration template
└── README.md               # This file
```

## 🛠️ Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd /Users/priyasingh/chess-v4/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server:**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000,http://localhost:1420

# Security
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=100

# Game Settings
DEFAULT_TIME_CONTROL=blitz
DEFAULT_INITIAL_TIME=300000
DEFAULT_INCREMENT=5000

# Room Settings
ROOM_EXPIRATION_HOURS=24
MAX_ROOMS_PER_USER=3

# Logging
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=true
```

## 🌐 API Endpoints

### Room Management
- `POST /api/rooms/create` - Create new room with invitation code
- `POST /api/rooms/join` - Join room with code
- `GET /api/rooms/:code` - Get room information
- `GET /api/rooms` - Get all active rooms
- `DELETE /api/rooms/:code` - Delete room (creator only)
- `POST /api/rooms/:code/settings` - Update room settings

### System
- `GET /api/health` - Health check endpoint
- `GET /` - Server status and information

## 🔌 Socket.IO Events

### Room Management Events
```javascript
// Create room
socket.emit('create_room', { gameSettings }, callback);

// Join room
socket.emit('join_room', { roomCode, isSpectator }, callback);

// Leave room
socket.emit('leave_room', {}, callback);
```

### Game Events
```javascript
// Authentication
socket.emit('authenticate', { username, rating, preferences }, callback);

// Join matchmaking
socket.emit('join_matchmaking', { timeControl, rated }, callback);

// Make move
socket.emit('make_move', { gameId, from, to, promotion }, callback);

// Resign game
socket.emit('resign', { gameId }, callback);

// Offer/accept draw
socket.emit('draw_offer', { gameId, action }, callback);

// Send chat message
socket.emit('chat_message', { gameId, message, type }, callback);
```

### Server Events
```javascript
// Authentication result
socket.on('authenticated', (data) => { ... });

// Room updates
socket.on('room_updated', (data) => { ... });

// Game started
socket.on('game_started', (data) => { ... });

// Move made
socket.on('move_made', (data) => { ... });

// Game ended
socket.on('game_ended', (data) => { ... });

// Chat message received
socket.on('chat_message', (data) => { ... });

// Errors
socket.on('error', (error) => { ... });
```

## 🎮 Game Flow

### Room-Based Games
1. **Create Room**: Player creates room with game settings
2. **Share Code**: 4-digit code shared with opponent
3. **Join Room**: Opponent joins using the code
4. **Start Game**: Game starts automatically when 2 players present
5. **Play**: Real-time chess with chat and spectators
6. **End Game**: Results recorded, room available for new game

### Matchmaking Games
1. **Join Queue**: Player joins matchmaking for specific time control
2. **Match Found**: Server pairs players with similar ratings
3. **Start Game**: Game starts immediately
4. **Play**: Same as room-based games
5. **End Game**: Ratings updated, new game can be started

## 🔒 Security Features

### Rate Limiting
- **API requests**: 100 requests per 15 minutes per IP
- **Room creation**: 5 rooms per 5 minutes per IP
- **Authentication**: 10 attempts per 15 minutes per IP
- **Game moves**: 20 moves per 10 seconds per player
- **Chat messages**: 30 messages per minute per player

### Input Validation
- Room codes must match pattern `[A-Z]{2}[0-9]{2}`
- Usernames are sanitized and limited to 20 characters
- Chess moves validated with chess.js
- All user input is validated and sanitized

### Error Handling
- Comprehensive error logging
- Graceful error responses
- Stack traces in development only
- Performance monitoring

## 🏥 Health Monitoring

The `/api/health` endpoint provides:
- Server status and uptime
- Active rooms and sessions count
- Memory usage statistics
- Performance metrics
- Version information

## 📊 Logging

Structured logging with different levels:
- **Error**: Critical errors and exceptions
- **Warn**: Warning conditions and rate limits
- **Info**: General information and user actions
- **Debug**: Detailed debugging information

Log files are created in production mode with automatic rotation.

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start server
npm start
```

### Docker (Future)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Health check
npm run health
```

## 🔧 Development

### Adding New Features
1. Follow the existing project structure
2. Add comprehensive error handling
3. Include logging for important events
4. Add rate limiting for new endpoints
5. Update documentation

### Code Style
- Use JSDoc comments for functions
- Follow consistent naming conventions
- Handle errors gracefully
- Log important events and errors

## 📈 Performance

### Optimizations
- Compression middleware for responses
- Rate limiting to prevent abuse
- Efficient data structures for game state
- Cleanup intervals for expired data
- Memory usage monitoring

### Scalability Considerations
- In-memory storage (ready for database migration)
- Stateless design where possible
- Horizontal scaling preparation
- Load balancer compatibility

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure error handling is comprehensive
5. Test thoroughly before committing

## 📜 License

MIT License - See package.json for details

## 🆘 Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 3000 is available
- Verify all dependencies are installed
- Check environment variables

**Socket connections failing:**
- Verify CORS configuration
- Check frontend URL in environment
- Ensure websocket transport is enabled

**Rate limiting too aggressive:**
- Adjust rate limit settings in .env
- Check IP address detection
- Review rate limiter logs

**Game state issues:**
- Check chess.js validation
- Review game logic in GameState.js
- Verify move format and validation

For more issues, check the logs in the console or log files.