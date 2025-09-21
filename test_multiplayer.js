#!/usr/bin/env node

/**
 * Test script to verify the Chess v4 multiplayer flow
 * This simulates two players joining a room and starting a game
 */

const io = require('socket.io-client');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const ROOM_CODE = 'TEST';

let player1Socket = null;
let player2Socket = null;
let gameStarted = false;

console.log('🧪 Testing Chess v4 Multiplayer Flow');
console.log('=====================================\n');

// Player 1 - Create Room and Join
function setupPlayer1() {
  return new Promise((resolve, reject) => {
    console.log('👤 Player 1: Connecting...');

    player1Socket = io(BACKEND_URL, {
      auth: {
        username: 'TestPlayer1',
        rating: 1200,
        preferences: {
          timeControl: 'blitz',
          autoQueen: true,
          showCoordinates: true,
          playSound: true
        }
      },
      transports: ['polling', 'websocket'],
      timeout: 20000
    });

    player1Socket.on('connect', () => {
      console.log('✅ Player 1 connected:', player1Socket.id);

      // Create room first
      console.log('📦 Player 1: Creating room...');
      player1Socket.emit('create_room', {
        gameSettings: { time: 300, increment: 3 }
      }, (response) => {
        console.log('🏠 Create room response:', JSON.stringify(response, null, 2));

        if (response.success) {
          const roomCode = response.room.code;
          console.log(`✅ Room created with code: ${roomCode}`);

          // Now join the room
          console.log('🚪 Player 1: Joining room...');
          player1Socket.emit('join_room', {
            roomCode: roomCode,
            isSpectator: false
          }, (joinResponse) => {
            console.log('🚪 Join room response:', JSON.stringify(joinResponse, null, 2));

            if (joinResponse.success) {
              console.log('✅ Player 1 successfully joined room');
              resolve(roomCode);
            } else {
              reject(new Error('Player 1 failed to join room: ' + joinResponse.error));
            }
          });
        } else {
          reject(new Error('Failed to create room: ' + response.error));
        }
      });
    });

    player1Socket.on('connect_error', (error) => {
      console.error('❌ Player 1 connection error:', error);
      reject(error);
    });

    player1Socket.on('game_started', (data) => {
      console.log('\n🎯 Player 1 received game_started event!');
      console.log('Game data:', JSON.stringify(data, null, 2));
      gameStarted = true;
    });

    player1Socket.on('room_updated', (data) => {
      console.log('🔄 Player 1 received room_updated:', JSON.stringify(data, null, 2));
    });

    setTimeout(() => {
      if (!player1Socket.connected) {
        reject(new Error('Player 1 connection timeout'));
      }
    }, 10000);
  });
}

// Player 2 - Join Existing Room
function setupPlayer2(roomCode) {
  return new Promise((resolve, reject) => {
    console.log('\n👤 Player 2: Connecting...');

    player2Socket = io(BACKEND_URL, {
      auth: {
        username: 'TestPlayer2',
        rating: 1300,
        preferences: {
          timeControl: 'blitz',
          autoQueen: true,
          showCoordinates: true,
          playSound: true
        }
      },
      transports: ['polling', 'websocket'],
      timeout: 20000
    });

    player2Socket.on('connect', () => {
      console.log('✅ Player 2 connected:', player2Socket.id);

      console.log(`🚪 Player 2: Joining room ${roomCode}...`);
      player2Socket.emit('join_room', {
        roomCode: roomCode,
        isSpectator: false
      }, (response) => {
        console.log('🚪 Player 2 join response:', JSON.stringify(response, null, 2));

        if (response.success) {
          console.log('✅ Player 2 successfully joined room');
          resolve();
        } else {
          reject(new Error('Player 2 failed to join room: ' + response.error));
        }
      });
    });

    player2Socket.on('connect_error', (error) => {
      console.error('❌ Player 2 connection error:', error);
      reject(error);
    });

    player2Socket.on('game_started', (data) => {
      console.log('\n🎯 Player 2 received game_started event!');
      console.log('Game data:', JSON.stringify(data, null, 2));
      gameStarted = true;
    });

    player2Socket.on('room_updated', (data) => {
      console.log('🔄 Player 2 received room_updated:', JSON.stringify(data, null, 2));
    });

    setTimeout(() => {
      if (!player2Socket.connected) {
        reject(new Error('Player 2 connection timeout'));
      }
    }, 10000);
  });
}

// Main test function
async function runTest() {
  try {
    // Step 1: Setup Player 1 and create room
    const roomCode = await setupPlayer1();

    // Wait a moment for room to be properly set up
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Setup Player 2 and join room
    await setupPlayer2(roomCode);

    // Wait for game to start automatically
    console.log('\n⏳ Waiting for automatic game start...');

    // Give it 5 seconds to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (gameStarted) {
      console.log('\n🎉 SUCCESS: Game started automatically!');
      console.log('✅ Multiplayer flow is working correctly');
    } else {
      console.log('\n❌ FAILURE: Game did not start automatically');
      console.log('🐛 Issue: game_started event was not received');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up connections...');
    if (player1Socket) player1Socket.disconnect();
    if (player2Socket) player2Socket.disconnect();

    setTimeout(() => {
      process.exit(gameStarted ? 0 : 1);
    }, 1000);
  }
}

// Run the test
runTest();