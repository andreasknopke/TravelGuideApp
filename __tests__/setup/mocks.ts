import { NavigationProp, RouteProp } from '@react-navigation/native';

// Navigation mock factory
export function createMockNavigation<T extends object = any>(): any {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
    reset: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => false),
    getState: jest.fn()
  };
}

// Route mock factory
export function createMockRoute<T extends object>(
  name: string,
  params?: T
): any {
  return {
    key: `${name}-${Math.random()}`,
    name,
    params
  };
}

// Axios mock helper
export function mockAxiosSuccess<T>(url: string, data: T): void {
  const axios = require('axios');
  axios.get = jest.fn().mockResolvedValueOnce({ data, status: 200 });
}

export function mockAxiosError(url: string, error: Error): void {
  const axios = require('axios');
  axios.get = jest.fn().mockRejectedValueOnce(error);
}

// Location permission mock
export function mockLocationPermission(status: 'granted' | 'denied'): void {
  const Location = require('expo-location');
  Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
    status,
    granted: status === 'granted',
    canAskAgain: status === 'denied',
    expires: 'never'
  });
}

// Current location mock
export function mockCurrentLocation(
  latitude: number,
  longitude: number
): void {
  const Location = require('expo-location');
  Location.getCurrentPositionAsync.mockResolvedValueOnce({
    coords: {
      latitude,
      longitude,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0
    },
    timestamp: Date.now()
  });
}
