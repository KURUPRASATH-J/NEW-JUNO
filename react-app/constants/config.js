import { Platform } from 'react-native';

const getApiUrl = () => {
  if (__DEV__) {
    // Use your PC's actual WiFi IP so physical devices can connect
    // Change this IP if your network changes
    return 'http://10.92.49.225:7860';
  }
  return 'https://your-production-url.com';
};

export const config = {
  API_URL: getApiUrl(),
  APP_NAME: 'JUNO AI',
  APP_VERSION: '1.0.0',
  MAX_MESSAGE_LENGTH: 10000,
  MAX_FILE_SIZE_MB: 10,
  SUPPORTED_FILE_TYPES: ['.pdf'],
  ANIMATION_DURATION: 300,
  TYPING_INDICATOR_DELAY: 500,
};

export default config;
