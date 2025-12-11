/**
 * Tests for useLocation hook
 * Coverage target: 85%
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useLocation } from '../../src/hooks/useLocation';
import { locationService } from '../../src/services';
import { berlinCoordinates, tokyoCoordinates, createMockPosition } from '../fixtures/locations';

jest.mock('../../src/services');
jest.mock('../../src/utils/distance');

// Mock expo-location permissions
jest.mock('expo-location', () => ({
  ...jest.requireActual('expo-location'),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

const mockedLocationService = locationService as jest.Mocked<typeof locationService>;

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLocationService.getCurrentLocation.mockResolvedValue(createMockPosition(berlinCoordinates));
    mockedLocationService.reverseGeocode.mockResolvedValue({
      city: 'Berlin',
      country: 'Germany',
      state: 'Berlin',
      fullAddress: 'Berlin, Germany',
      latitude: berlinCoordinates.latitude,
      longitude: berlinCoordinates.longitude,
    });
  });

  describe('Initial load', () => {
    it('should load location on mount', async () => {
      const { result } = renderHook(() => useLocation());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.location).toEqual(berlinCoordinates);
      expect(mockedLocationService.getCurrentLocation).toHaveBeenCalled();
    });

    it('should load city info after location', async () => {
      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cityInfo).toEqual({
        city: 'Berlin',
        country: 'Germany',
        state: 'Berlin',
        fullAddress: 'Berlin, Germany',
        latitude: berlinCoordinates.latitude,
        longitude: berlinCoordinates.longitude,
      });
      expect(mockedLocationService.reverseGeocode).toHaveBeenCalledWith(berlinCoordinates);
    });

    it('should handle location fetch errors', async () => {
      const errorMessage = 'Location permission denied';
      mockedLocationService.getCurrentLocation.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.location).toBeNull();
    });

    it('should handle null location response', async () => {
      mockedLocationService.getCurrentLocation.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.location).toBeNull();
      expect(result.current.cityInfo).toBeNull();
    });
  });

  describe('Location tracking', () => {
    it('should start tracking when enableTracking is true', async () => {
      const mockSubscription = { remove: jest.fn() };
      mockedLocationService.watchPosition.mockResolvedValueOnce(mockSubscription);

      const { result, unmount } = renderHook(() => useLocation(true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(mockedLocationService.watchPosition).toHaveBeenCalled();
      });

      unmount();
      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    it('should not start tracking when enableTracking is false', async () => {
      const { result } = renderHook(() => useLocation(false));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedLocationService.watchPosition).not.toHaveBeenCalled();
    });

    it('should update location on significant movement', async () => {
      const { hasSignificantMovement } = require('../../src/utils/distance');
      hasSignificantMovement.mockReturnValue(true);

      let watchCallback: ((location: Location.LocationObject) => void) | null = null;
      const mockSubscription = { remove: jest.fn() };
      mockedLocationService.watchPosition.mockImplementation(async (callback) => {
        watchCallback = callback;
        return mockSubscription;
      });

      const { result } = renderHook(() => useLocation(true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(watchCallback).not.toBeNull();

      // Simulate location update
      act(() => {
        watchCallback!(createMockPosition(tokyoCoordinates));
      });

      await waitFor(() => {
        expect(result.current.location).toEqual(tokyoCoordinates);
      });

      expect(mockedLocationService.reverseGeocode).toHaveBeenCalledWith(tokyoCoordinates);
    });

    it('should not update location without significant movement', async () => {
      const { hasSignificantMovement } = require('../../src/utils/distance');
      hasSignificantMovement.mockReturnValue(false);

      let watchCallback: ((location: Location.LocationObject) => void) | null = null;
      const mockSubscription = { remove: jest.fn() };
      mockedLocationService.watchPosition.mockImplementation(async (callback) => {
        watchCallback = callback;
        return mockSubscription;
      });

      const { result } = renderHook(() => useLocation(true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalLocation = result.current.location;
      const reverseGeocodeCalls = mockedLocationService.reverseGeocode.mock.calls.length;

      // Simulate minor location update
      act(() => {
        watchCallback!(createMockPosition(berlinCoordinates));
      });

      await waitFor(() => {
        expect(result.current.location).toEqual(originalLocation);
      });

      // Should not trigger additional reverse geocode
      expect(mockedLocationService.reverseGeocode).toHaveBeenCalledTimes(reverseGeocodeCalls);
    });

    it('should cleanup subscription on unmount', async () => {
      const mockSubscription = { remove: jest.fn() };
      mockedLocationService.watchPosition.mockResolvedValueOnce(mockSubscription);

      const { unmount } = renderHook(() => useLocation(true));

      await waitFor(() => {
        expect(mockedLocationService.watchPosition).toHaveBeenCalled();
      });

      unmount();

      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    it('should handle null subscription gracefully', async () => {
      mockedLocationService.watchPosition.mockResolvedValueOnce(null);

      const { unmount } = renderHook(() => useLocation(true));

      await waitFor(() => {
        expect(mockedLocationService.watchPosition).toHaveBeenCalled();
      });

      // Should not throw error on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('refreshLocation', () => {
    it('should reload location and city info', async () => {
      const { result } = renderHook(() => useLocation(false));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.location).toEqual(berlinCoordinates);

      // Change mock to return different location
      mockedLocationService.getCurrentLocation.mockResolvedValueOnce(createMockPosition(tokyoCoordinates));
      mockedLocationService.reverseGeocode.mockResolvedValueOnce({
        city: 'Tokyo',
        country: 'Japan',
        state: 'Tokyo',
        fullAddress: 'Tokyo, Japan',
        latitude: tokyoCoordinates.latitude,
        longitude: tokyoCoordinates.longitude,
      });

      await act(async () => {
        await result.current.refreshLocation();
      });

      await waitFor(() => {
        expect(result.current.location).toEqual(tokyoCoordinates);
        expect(result.current.cityInfo?.city).toBe('Tokyo');
      });
    });

    it('should clear previous error on refresh', async () => {
      mockedLocationService.getCurrentLocation.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useLocation(false));

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      mockedLocationService.getCurrentLocation.mockResolvedValueOnce(createMockPosition(berlinCoordinates));

      await act(async () => {
        await result.current.refreshLocation();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.location).toEqual(berlinCoordinates);
      });
    });
  });

  describe('GPS Status', () => {
    it('should start with SEARCHING status', async () => {
      const { result } = renderHook(() => useLocation());

      expect(result.current.gpsStatus).toBe('SEARCHING');
    });

    it('should set ACTIVE status when location is acquired', async () => {
      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.gpsStatus).toBe('ACTIVE');
      });
    });

    it('should set PERMISSION_DENIED status when permissions are denied', async () => {
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.gpsStatus).toBe('PERMISSION_DENIED');
        expect(result.current.error).toBe('Location permission denied');
      });
    });

    it('should set UNAVAILABLE status on location fetch error', async () => {
      mockedLocationService.getCurrentLocation.mockRejectedValueOnce(new Error('GPS unavailable'));

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.gpsStatus).toBe('UNAVAILABLE');
      });
    });

    it('should set UNAVAILABLE status when location is null', async () => {
      mockedLocationService.getCurrentLocation.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.gpsStatus).toBe('UNAVAILABLE');
      });
    });
  });
});
