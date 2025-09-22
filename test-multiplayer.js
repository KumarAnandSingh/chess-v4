/**
 * Simple multiplayer functionality test script
 * Tests the multiplayer flow with production backend
 */

const { io } = require('socket.io-client');

const BACKEND_URL = 'https://chess-v4-production.up.railway.app';

// Test user data
const testUsers = [
  { name: 'Player1', rating: 1200 },
  { name: 'Player2', rating: 1150 }
];

async function testMultiplayerFlow() {
  console.log('🎮 Starting Chess v4 Multiplayer Test');
  console.log('🌐 Backend URL:', BACKEND_URL);

  // Create two socket connections to simulate two players
  const player1Socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    timeout: 10000,
    auth: {
      username: testUsers[0].name,
      rating: testUsers[0].rating
    }
  });

  const player2Socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    timeout: 10000,
    autoConnect: false, // Don't connect until player 1 creates room
    auth: {
      username: testUsers[1].name,
      rating: testUsers[1].rating
    }
  });

  let roomCode = null;
  let gameStarted = false;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('❌ Test timeout - cleaning up...');
      player1Socket.disconnect();
      player2Socket.disconnect();
      reject(new Error('Test timeout after 30 seconds'));
    }, 30000);

    // Player 1 setup
    player1Socket.on('connect', () => {
      console.log('✅ Player 1 connected:', player1Socket.id);
    });

    player1Socket.on('authenticated', (authData) => {
      console.log('✅ Player 1 authenticated:', authData);

      // Create a room after authentication
      player1Socket.emit('create_room', {
        gameSettings: {
          timeControl: { time: 300, increment: 5 },
          rated: false
        }
      }, (response) => {
        console.log('✅ Room creation response:', response);
        if (response.success) {
          roomCode = response.roomCode;

          // Connect player 2 after room is created
          player2Socket.connect();
        } else {
          console.log('❌ Room creation failed:', response.error);
          clearTimeout(timeout);
          reject(new Error('Room creation failed: ' + response.error));
        }
      });
    });

    // Player 2 setup
    player2Socket.on('connect', () => {
      console.log('✅ Player 2 connected:', player2Socket.id);
    });

    player2Socket.on('authenticated', (authData) => {
      console.log('✅ Player 2 authenticated:', authData);

      // Join the room after authentication
      if (roomCode) {
        player2Socket.emit('join_room', {
          roomCode: roomCode,
          isSpectator: false
        }, (joinResponse) => {
          console.log('✅ Room join response:', joinResponse);
        });
      }
    });

    // Both players listen for room updates
    const handleRoomUpdate = (data) => {
      console.log('🏠 Room update:', data);
      if (data.players && data.players.length === 2) {
        console.log('✅ Both players in room - game should start automatically');
      }
    };

    player1Socket.on('room_updated', handleRoomUpdate);
    player2Socket.on('room_updated', handleRoomUpdate);

    // Both players listen for game start
    const handleGameStarted = (data) => {
      console.log('🎯 GAME STARTED!');
      console.log('Game data:', JSON.stringify(data, null, 2));

      if (data.gameId && data.gameState) {
        console.log('✅ MULTIPLAYER TEST PASSED!');
        console.log('- ✅ Room creation successful');
        console.log('- ✅ Player joining successful');
        console.log('- ✅ Game initialization successful');
        console.log('- ✅ Game ID:', data.gameId);
        console.log('- ✅ Game State received with proper structure');
        gameStarted = true;

        clearTimeout(timeout);
        player1Socket.disconnect();
        player2Socket.disconnect();
        resolve({
          success: true,
          roomCode,
          gameId: data.gameId,
          gameState: data.gameState
        });
      } else {
        console.log('❌ Game started but missing required data');
        console.log('- GameId:', !!data.gameId);
        console.log('- GameState:', !!data.gameState);
      }
    };

    player1Socket.on('game_started', handleGameStarted);
    player2Socket.on('game_started', handleGameStarted);

    // Error handling
    player1Socket.on('error', (error) => {
      console.log('❌ Player 1 error:', error);
    });

    player2Socket.on('error', (error) => {
      console.log('❌ Player 2 error:', error);
    });

    player1Socket.on('connect_error', (error) => {
      console.log('❌ Player 1 connection error:', error.message);
      clearTimeout(timeout);
      reject(error);
    });

    player2Socket.on('connect_error', (error) => {
      console.log('❌ Player 2 connection error:', error.message);
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Run the test
testMultiplayerFlow()
  .then((result) => {
    console.log('\n🎉 MULTIPLAYER TEST COMPLETED SUCCESSFULLY!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n❌ MULTIPLAYER TEST FAILED!');
    console.error('Error:', error.message);
    process.exit(1);
  });