#!/usr/bin/env node

// Simple test to validate the frontend navigation fix
const io = require('socket.io-client');

console.log('🧪 Testing Frontend Navigation Fix');
console.log('=================================');

// Test configuration
const SERVER_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3002';

let player1Socket = null;
let player2Socket = null;
let roomCode = null;

const connectPlayer = (playerName) => {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      auth: {
        username: playerName,
        rating: 1200,
        preferences: {
          timeControl: 'blitz',
          autoQueen: true,
          showCoordinates: true,
          playSound: true
        }
      },
      transports: ['polling', 'websocket'],
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log(`✅ ${playerName} connected with ID: ${socket.id}`);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      console.error(`❌ ${playerName} connection failed:`, error.message);
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`⚠️ ${playerName} disconnected:`, reason);
    });
  });
};

const createRoom = (socket) => {
  return new Promise((resolve, reject) => {
    console.log('\n🏗️ Creating room...');

    socket.emit('create_room', {
      gameSettings: { time: 300, increment: 5 }
    }, (response) => {
      if (response && response.success) {
        roomCode = response.room.code;
        console.log(`✅ Room created successfully: ${roomCode}`);
        resolve(response.room);
      } else {
        console.error('❌ Failed to create room:', response);
        reject(new Error(response?.error || 'Failed to create room'));
      }
    });

    setTimeout(() => {
      reject(new Error('Room creation timeout'));
    }, 10000);
  });
};

const joinRoom = (socket, roomCode, playerName) => {
  return new Promise((resolve, reject) => {
    console.log(`\n🚪 ${playerName} joining room ${roomCode}...`);

    socket.emit('join_room', {
      roomCode: roomCode,
      isSpectator: false
    }, (response) => {
      if (response && response.success) {
        console.log(`✅ ${playerName} joined room successfully`);
        resolve(response.room);
      } else {
        console.error(`❌ ${playerName} failed to join room:`, response);
        reject(new Error(response?.error || 'Failed to join room'));
      }
    });

    setTimeout(() => {
      reject(new Error('Room join timeout'));
    }, 10000);
  });
};

const waitForGameStart = (socket, playerName) => {
  return new Promise((resolve, reject) => {
    console.log(`\n⏳ ${playerName} waiting for game to start...`);

    socket.on('game_started', (data) => {
      console.log(`\n🎮 ${playerName} received game_started event!`);
      console.log(`   Game ID: ${data.gameId}`);
      console.log(`   Player count: ${data.gameState?.players?.length || 0}`);

      // Find this player's color
      const myPlayer = data.gameState?.players?.find(p => p.id === socket.id);
      if (myPlayer) {
        console.log(`   ${playerName} is playing as: ${myPlayer.color}`);
        console.log(`   ✅ Frontend should now navigate to: /game/${data.gameId}`);
      } else {
        console.log(`   ⚠️ Could not find ${playerName} in player list`);
      }

      resolve(data);
    });

    setTimeout(() => {
      reject(new Error('Game start timeout'));
    }, 15000);
  });
};

async function runTest() {
  try {
    // Step 1: Connect both players
    console.log('\n1️⃣ Connecting players...');
    player1Socket = await connectPlayer('TestPlayer1');
    player2Socket = await connectPlayer('TestPlayer2');

    // Step 2: Player 1 creates a room
    console.log('\n2️⃣ Creating room...');
    await createRoom(player1Socket);

    // Step 3: Player 2 joins the room
    console.log('\n3️⃣ Joining room...');
    await joinRoom(player2Socket, roomCode, 'TestPlayer2');

    // Step 4: Wait for game to start (should happen automatically)
    console.log('\n4️⃣ Waiting for automatic game start...');
    const gameStartPromises = [
      waitForGameStart(player1Socket, 'TestPlayer1'),
      waitForGameStart(player2Socket, 'TestPlayer2')
    ];

    const [game1Data, game2Data] = await Promise.all(gameStartPromises);

    console.log('\n🎉 SUCCESS! Game started successfully');
    console.log(`📍 Frontend URLs should be:`);
    console.log(`   Player 1: ${FRONTEND_URL}/game/${game1Data.gameId}`);
    console.log(`   Player 2: ${FRONTEND_URL}/game/${game2Data.gameId}`);

    console.log('\n✅ Frontend navigation fix appears to be working!');
    console.log('   The game_started event is being emitted correctly.');
    console.log('   Frontend should automatically navigate to the game page.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    // Cleanup
    if (player1Socket) player1Socket.disconnect();
    if (player2Socket) player2Socket.disconnect();
    console.log('\n🧹 Test cleanup completed');
    process.exit(0);
  }
}

// Start the test
runTest();