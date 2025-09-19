# Chess v4 Frontend

A modern, feature-rich chess application built with React, TypeScript, and Tailwind CSS. This frontend integrates seamlessly with the Chess v4 backend to provide real-time multiplayer chess with room-based invitations, AI practice, and educational features.

## 🚀 Features

### 🏠 **Room-Based Multiplayer**
- **Create Rooms**: Generate 4-digit alphanumeric room codes (e.g., "AB12", "QQ17")
- **Join Rooms**: Enter room codes to join private games with friends
- **Room Management**: Real-time room status, player management, and chat
- **Share Functionality**: Easy copy/share of room codes and links

### ♟️ **Core Chess Features**
- **Interactive Chess Board**: Powered by react-chessboard with move validation
- **Real-time Gameplay**: Socket.IO integration for instant move synchronization
- **Multiple Time Controls**: Bullet (1+1), Blitz (5+3), Rapid (10+5), Classical (30+30)
- **Game Features**: Move history, captured pieces, draw offers, resignation
- **Mobile Responsive**: Optimized for all screen sizes

### 🎓 **Educational Features**
- **Hint System**: Smart move suggestions for learning
- **Audio Feedback**: Sound effects for moves, captures, check, and game end
- **Visual Effects**: Piece animations, move highlighting, confetti celebrations
- **Progress Tracking**: XP system, levels, achievements, and statistics

### 🤖 **AI Practice**
- **Multiple Difficulty Levels**: Beginner (800) to Expert (2000) rated bots
- **Practice Modes**: Standard games, endgame practice, opening trainer, tactical puzzles
- **Learning Tools**: Hints, analysis, and educational tips

### 🎨 **Modern UI/UX**
- **Dark/Light Theme**: System preference detection with manual override
- **Smooth Animations**: Framer Motion powered transitions and interactions
- **Accessibility**: Keyboard navigation, screen reader support, semantic HTML
- **Professional Design**: Clean, modern interface with intuitive controls

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for global state
- **Chess Logic**: chess.js for move validation and game logic
- **Chess Board**: react-chessboard for interactive gameplay
- **Real-time**: Socket.IO client for multiplayer features
- **Animations**: Framer Motion for smooth transitions
- **Audio**: Howler.js for sound effects
- **Icons**: Lucide React for consistent iconography
- **Routing**: React Router for navigation
- **Build Tool**: Vite for fast development and optimized builds

## 📦 Installation

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Build for Production**
```bash
npm run build
```

4. **Preview Production Build**
```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables
The frontend connects to the backend at `http://localhost:3001` by default. This is configured in `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
    '/socket.io': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      ws: true,
    },
  },
}
```

### Audio Files
Place audio files in `public/sounds/`:
- `move.mp3` - Regular move sound
- `capture.mp3` - Piece capture sound
- `check.mp3` - Check notification
- `checkmate.mp3` - Checkmate sound
- `draw.mp3` - Draw game sound
- `victory.mp3` - Win celebration
- `defeat.mp3` - Loss sound
- `notification.mp3` - General notifications

## 🏗️ Architecture

### Project Structure
```
src/
├── components/
│   ├── chess/          # Chess-specific components
│   │   ├── ChessBoard.tsx
│   │   ├── GameInfo.tsx
│   │   ├── MoveList.tsx
│   │   └── GameChat.tsx
│   ├── rooms/          # Room management components
│   │   ├── CreateRoomModal.tsx
│   │   ├── JoinRoomModal.tsx
│   │   └── RoomLobby.tsx
│   ├── ui/             # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   └── layout/         # Layout components
│       ├── Layout.tsx
│       └── Header.tsx
├── pages/              # Main application pages
│   ├── LandingPage.tsx
│   ├── LobbyPage.tsx
│   ├── RoomPage.tsx
│   ├── GamePage.tsx
│   └── PracticePage.tsx
├── services/           # External service integrations
│   ├── socketService.ts
│   └── audioService.ts
├── stores/             # Zustand state management
│   ├── authStore.ts
│   ├── roomStore.ts
│   ├── gameStore.ts
│   └── uiStore.ts
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── cn.ts           # Tailwind class merger
│   └── constants.ts    # App constants
└── assets/             # Static assets
```

### State Management

**Auth Store**: User management, statistics, preferences, achievements
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  updateUserStats: (stats: Partial<UserStats>) => void
  addXP: (amount: number) => void
}
```

**Room Store**: Room creation, joining, and management
```typescript
interface RoomState {
  currentRoom: RoomData | null
  isInRoom: boolean
  createRoom: (timeControl: TimeControl) => Promise<void>
  joinRoom: (roomCode: string) => Promise<void>
}
```

**Game Store**: Chess game state and logic
```typescript
interface GameState {
  game: Chess
  gameState: GameState | null
  isMyTurn: boolean
  makeMove: (from: string, to: string) => boolean
  resign: () => void
}
```

**UI Store**: Theme, layout, and user interface preferences
```typescript
interface UIState {
  theme: 'light' | 'dark' | 'system'
  boardOrientation: 'white' | 'black'
  setTheme: (theme: Theme) => void
}
```

## 🔌 Backend Integration

### Socket.IO Events

**Room Events**:
- `create_room` - Create a new room
- `join_room` - Join existing room
- `room_created` - Room creation confirmation
- `room_joined` - Room join confirmation
- `room_updated` - Room state changes

**Game Events**:
- `start_game` - Initialize game
- `make_move` - Send move to opponent
- `move_made` - Receive opponent's move
- `game_ended` - Game conclusion

**Chat Events**:
- `send_message` - Send chat message
- `message_received` - Receive chat message

### API Endpoints
- `POST /api/rooms/create` - Create room via REST
- `POST /api/rooms/join` - Join room via REST
- `GET /api/rooms/:code` - Get room info

## 🎮 Game Flow

### Room-Based Games
1. **Create Room**: User selects time control → generates 4-digit code
2. **Share Code**: Copy/share room code with friend
3. **Join Room**: Friend enters code → joins room lobby
4. **Room Lobby**: Chat, see players, room creator can start game
5. **Game Start**: Navigate to game page with real-time chess
6. **Game End**: Results, stats update, return to lobby

### Quick Match
1. **Select Time Control**: Choose from preset options
2. **Find Match**: Automatic opponent matching
3. **Game Start**: Direct to game with matched player

### Practice Mode
1. **Select AI Level**: Choose difficulty (800-2000 rating)
2. **Choose Mode**: Standard, endgame, opening, tactics
3. **Practice Game**: Play against AI with hints and analysis

## 🎨 Design System

### Colors
- **Primary**: Blue scale (`primary-50` to `primary-900`)
- **Secondary**: Slate scale for neutral elements
- **Chess Board**: Custom `chess-light` and `chess-dark` colors
- **Highlights**: Yellow for selections, red for check/danger

### Typography
- **Font**: Inter for UI, JetBrains Mono for code/chess notation
- **Hierarchy**: Consistent sizing and weight scale

### Components
- **Cards**: Elevated, outlined, and glass variants
- **Buttons**: Primary, secondary, ghost, danger styles
- **Inputs**: Consistent styling with error states
- **Modals**: Backdrop blur with smooth animations

## 📱 Mobile Optimization

- **Responsive Chess Board**: Adapts to screen size
- **Touch Interactions**: Optimized for mobile piece movement
- **Mobile Navigation**: Collapsible menus and overlays
- **Gesture Support**: Swipe and tap interactions
- **PWA Ready**: Can be installed as mobile app

## ♿ Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: WCAG AA compliant color ratios
- **Focus Management**: Visible focus indicators
- **Alternative Text**: Descriptive alt text for images

## 🔊 Audio System

- **Dynamic Loading**: Sounds loaded on demand
- **Volume Control**: User-adjustable volume settings
- **Context Aware**: Different sounds for captures, checks, wins
- **Mobile Support**: HTML5 Audio for better mobile compatibility
- **Graceful Fallback**: Silent operation if audio fails

## 🚀 Performance

- **Code Splitting**: Route-based lazy loading
- **Asset Optimization**: Vite's built-in optimizations
- **Efficient Rendering**: React.memo and useMemo where needed
- **State Management**: Minimal re-renders with Zustand
- **Image Optimization**: SVG icons and optimized assets

## 🧪 Development

### Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Development Server
- **Port**: 3000 (configurable in `vite.config.ts`)
- **Proxy**: API calls proxied to backend at localhost:3001
- **Hot Reload**: Automatic browser refresh on changes
- **TypeScript**: Real-time type checking

## 🔮 Future Enhancements

- **Tournament Mode**: Multi-round tournament support
- **Spectator Mode**: Watch ongoing games
- **Puzzle Database**: Extensive tactical puzzle collection
- **Opening Explorer**: Interactive opening database
- **Game Analysis**: Computer analysis integration
- **Clubs & Teams**: Social features for chess communities
- **Streaming Integration**: Twitch/YouTube integration for streamers

## 📄 License

This project is part of the Chess v4 application suite. See the main project README for licensing information.

---

**Chess v4 Frontend** - Built with ❤️ for chess enthusiasts worldwide