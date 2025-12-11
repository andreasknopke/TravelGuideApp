import '@testing-library/jest-native/extend-expect';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock i18n configuration module
jest.mock('../../src/config/i18n', () => ({
  __esModule: true,
  default: {
    language: 'de',
    changeLanguage: jest.fn(),
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
    t: jest.fn((key: string) => key),
  }
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'de',
      changeLanguage: jest.fn()
    }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn()
  }
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6
  },
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined'
  }
}));

// Mock error notification service
jest.mock('../../src/services/error-notification.service', () => ({
  __esModule: true,
  default: {
    showError: jest.fn(),
    clearAllNotifications: jest.fn(),
    logDebugInfo: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
