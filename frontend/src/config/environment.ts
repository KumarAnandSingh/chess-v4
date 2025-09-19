/**
 * Environment configuration for Chess v4 Frontend
 * Handles different configurations for development and production
 */

export interface Environment {
  backendUrl: string;
  websocketUrl: string;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  features: {
    analytics: boolean;
    chat: boolean;
    spectatorMode: boolean;
  };
  game: {
    defaultTimeControl: string;
    maxRoomCodeLength: number;
  };
  ui: {
    theme: string;
    enableSound: boolean;
    enableAnimations: boolean;
  };
}

// Helper function to get environment variable with fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
  return (import.meta.env && import.meta.env[key]) || fallback;
};

// Determine if we're in development mode
const isDevelopment = (import.meta.env && import.meta.env.MODE) === 'development';
const isProduction = (import.meta.env && import.meta.env.MODE) === 'production';

// Base URLs
const getBackendUrl = (): string => {
  if (isDevelopment) {
    return 'http://localhost:3001';
  }

  // Use environment variable in production
  return getEnvVar('VITE_BACKEND_URL', 'http://localhost:3001');
};

const getWebSocketUrl = (): string => {
  const backendUrl = getBackendUrl();
  return getEnvVar('VITE_WEBSOCKET_URL', backendUrl);
};

// Create environment configuration
export const environment: Environment = {
  backendUrl: getBackendUrl(),
  websocketUrl: getWebSocketUrl(),
  nodeEnv: (import.meta.env && import.meta.env.MODE) || 'development',
  isProduction,
  isDevelopment,

  features: {
    analytics: getEnvVar('VITE_ENABLE_ANALYTICS', 'false') === 'true',
    chat: getEnvVar('VITE_ENABLE_CHAT', 'true') === 'true',
    spectatorMode: getEnvVar('VITE_ENABLE_SPECTATOR_MODE', 'true') === 'true',
  },

  game: {
    defaultTimeControl: getEnvVar('VITE_DEFAULT_TIME_CONTROL', 'blitz'),
    maxRoomCodeLength: parseInt(getEnvVar('VITE_MAX_ROOM_CODE_LENGTH', '4'), 10),
  },

  ui: {
    theme: getEnvVar('VITE_THEME', 'default'),
    enableSound: getEnvVar('VITE_ENABLE_SOUND', 'true') === 'true',
    enableAnimations: getEnvVar('VITE_ENABLE_ANIMATIONS', 'true') === 'true',
  },
};

// Export individual configurations for convenience
export const {
  backendUrl,
  websocketUrl,
  isProduction: envIsProduction,
  isDevelopment: envIsDevelopment
} = environment;

// Development logging
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    mode: (import.meta.env && import.meta.env.MODE) || 'unknown',
    backendUrl: environment.backendUrl,
    websocketUrl: environment.websocketUrl,
    features: environment.features,
  });
}

export default environment;