// Game constants
export const GAME_MODES = {
  BLITZ: { time: 300, increment: 3, label: '5+3 Blitz' },
  RAPID: { time: 600, increment: 5, label: '10+5 Rapid' },
  CLASSICAL: { time: 1800, increment: 30, label: '30+30 Classical' },
  BULLET: { time: 60, increment: 1, label: '1+1 Bullet' },
  CUSTOM: { time: 0, increment: 0, label: 'Custom' },
} as const

// Audio constants
export const AUDIO_FILES = {
  MOVE: '/sounds/move.mp3',
  CAPTURE: '/sounds/capture.mp3',
  CHECK: '/sounds/check.mp3',
  CHECKMATE: '/sounds/checkmate.mp3',
  DRAW: '/sounds/draw.mp3',
  NOTIFICATION: '/sounds/notification.mp3',
  VICTORY: '/sounds/victory.mp3',
  DEFEAT: '/sounds/defeat.mp3',
} as const

// Achievement constants
export const ACHIEVEMENTS = {
  FIRST_GAME: { id: 'first_game', name: 'First Steps', description: 'Play your first game', xp: 50 },
  FIRST_WIN: { id: 'first_win', name: 'Victory!', description: 'Win your first game', xp: 100 },
  CHECKMATE_ARTIST: { id: 'checkmate_artist', name: 'Checkmate Artist', description: 'Deliver checkmate 10 times', xp: 250 },
  ROOM_CREATOR: { id: 'room_creator', name: 'Room Creator', description: 'Create your first room', xp: 75 },
  SOCIAL_PLAYER: { id: 'social_player', name: 'Social Player', description: 'Play 5 games with friends', xp: 200 },
} as const

// UI constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

export const QUICK_MESSAGES = [
  'Good luck!',
  'Well played!',
  'Nice move!',
  'Good game!',
  'Thanks for the game!',
  'Rematch?',
] as const

// Room constants
export const ROOM_STATUS = {
  WAITING: 'waiting',
  READY: 'ready',
  PLAYING: 'playing',
  FINISHED: 'finished',
} as const

// Game status constants
export const GAME_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
  ABANDONED: 'abandoned',
} as const

// Socket events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Room events
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  ROOM_UPDATED: 'room_updated',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',

  // Game events
  START_GAME: 'start_game',
  MAKE_MOVE: 'make_move',
  GAME_STARTED: 'game_started',
  MOVE_MADE: 'move_made',
  GAME_ENDED: 'game_ended',
  RESIGN: 'resign',
  DRAW_OFFER: 'draw_offer',
  DRAW_RESPONSE: 'draw_response',

  // Chat events
  SEND_MESSAGE: 'send_message',
  MESSAGE_RECEIVED: 'message_received',

  // Matchmaking events
  FIND_MATCH: 'find_match',
  MATCH_FOUND: 'match_found',
  CANCEL_SEARCH: 'cancel_search',

  // Error events
  ERROR: 'error',
  ROOM_ERROR: 'room_error',
  GAME_ERROR: 'game_error',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'chess_v4_user_preferences',
  AUDIO_SETTINGS: 'chess_v4_audio_settings',
  THEME: 'chess_v4_theme',
  USER_STATS: 'chess_v4_user_stats',
} as const

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  PIECE_MOVE: 300,
  CONFETTI: 3000,
} as const