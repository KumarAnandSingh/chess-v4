# Chess v4 🏆

A modern, real-time multiplayer chess platform built with React, TypeScript, and Node.js.

## Features ✨

- **Real-time Multiplayer**: Play chess with friends using Socket.IO
- **4-Digit Room Codes**: Create and join private games with simple alphanumeric codes
- **Full Chess Logic**: Complete chess rules with move validation using chess.js
- **Modern UI**: Beautiful, responsive interface with dark/light themes
- **Game History**: Track moves, time controls, and game outcomes
- **Sound Effects**: Audio feedback for moves, captures, check, and checkmate
- **Hints System**: Get move suggestions when needed

## Tech Stack 🚀

### Frontend
- React 18 with TypeScript
- Vite for fast development and building
- Zustand for state management
- Tailwind CSS for styling
- Framer Motion for animations
- Socket.IO client for real-time communication

### Backend
- Node.js with Express
- Socket.IO for real-time multiplayer
- Chess.js for game logic validation
- Comprehensive Jest test suite

### Deployment
- Frontend: Vercel
- Backend: Railway
- CI/CD: GitHub Actions

## Getting Started 🎮

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/KumarAnandSingh/chess-v4.git
   cd chess-v4
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Testing 🧪

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Build
```bash
cd frontend
npm run build
```

## Deployment 🚀

The project uses automated CI/CD with GitHub Actions:
- Backend deploys to Railway
- Frontend deploys to Vercel
- Automatic testing and deployment on main branch pushes

## Project Structure 📁

```
chess-v4/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── .github/           # GitHub Actions workflows
└── README.md         # Project documentation
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## License 📄

This project is open source and available under the MIT License.

---

Built with ❤️ by [Kumar Anand Singh](https://github.com/KumarAnandSingh)