/**
 * Tests for LocationService
 * Coverage target: 90%
 */

import * as Location from 'expo-location';
import axios from 'axios';
import locationService from '../../src/services/location.service';
import errorNotificationService from '../../src/services/error-notification.service';
import { berlinCoordinates, tokyoCoordinates, permissionGranted, permissionDenied } from '../fixtures/locations';
import { mockLocationPermission, mockCurrentLocation } from '../setup/mocks';
import { API_ENDPOINTS, APP_CONFIG } from '../../src/constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('should return true when permission is granted', async () => {
      mockLocationPermission('granted');

      const result = await locationService.requestPermissions();

      expect(result).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false when permission is denied', async () => {
      mockLocationPermission('denied');

      const result = await locationService.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return location when permission is granted', async () => {
      mockLocationPermission('granted');
      mockCurrentLocation(berlinCoordinates.latitude, berlinCoordinates.longitude);

      const result = await locationService.getCurrentLocation();

      expect(result).not.toBeNull();
      expect(result?.coords.latitude).toBe(berlinCoordinates.latitude);
      expect(result?.coords.longitude).toBe(berlinCoordinates.longitude);
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    });

    it('should return null when permission is denied', async () => {
      mockLocationPermission('denied');

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should return null when location fetch fails', async () => {
      mockLocationPermission('granted');
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Location error')
      );

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });
  });

  describe('watchPosition', () => {
    it('should start watching position when permission granted', async () => {
      mockLocationPermission('granted');
      const mockSubscription = { remove: jest.fn() };
      (Location.watchPositionAsync as jest.Mock).mockResolvedValueOnce(mockSubscription);
      const callback = jest.fn();

      const result = await locationService.watchPosition(callback);

      expect(result).toBe(mockSubscription);
      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 500,
          timeInterval: 120000,
        }),
        callback
      );
    });

    it('should use custom options when provided', async () => {
      mockLocationPermission('granted');
      const mockSubscription = { remove: jest.fn() };
      (Location.watchPositionAsync as jest.Mock).mockResolvedValueOnce(mockSubscription);
      const callback = jest.fn();
      const customOptions = {
        accuracy: Location.Accuracy.High,
        distanceInterval: 100,
        timeInterval: 5000,
      };

      await locationService.watchPosition(callback, customOptions);

      expect(Location.watchPositionAsync).toHaveBeenCalledWith(customOptions, callback);
    });

    it('should return null when permission is denied', async () => {
      mockLocationPermission('denied');
      const callback = jest.fn();

      const result = await locationService.watchPosition(callback);

      expect(result).toBeNull();
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should return null when watch fails', async () => {
      mockLocationPermission('granted');
      (Location.watchPositionAsync as jest.Mock).mockRejectedValueOnce(new Error('Watch error'));
      const callback = jest.fn();

      const result = await locationService.watchPosition(callback);

      expect(result).toBeNull();
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });
  });

  describe('reverseGeocode', () => {
    it('should return city info for valid coordinates', async () => {
      const mockResponse = {
        data: {
          address: {
            city: 'Berlin',
            country: 'Germany',
            state: 'Berlin',
          },
          display_name: 'Berlin, Germany',
          lat: '52.520008',
          lon: '13.404954',
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await locationService.reverseGeocode(berlinCoordinates);

      expect(result).toEqual({
        city: 'Berlin',
        country: 'Germany',
        state: 'Berlin',
        fullAddress: 'Berlin, Germany',
        latitude: 52.520008,
        longitude: 13.404954,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.NOMINATIM}/reverse`,
        expect.objectContaining({
          params: expect.objectContaining({
            lat: berlinCoordinates.latitude,
            lon: berlinCoordinates.longitude,
            format: 'json',
          }),
        })
      );
    });

    it('should handle town instead of city', async () => {
      const mockResponse = {
        data: {
          address: {
            town: 'Smallville',
            country: 'USA',
            state: 'Kansas',
          },
          display_name: 'Smallville, Kansas, USA',
          lat: '39.0',
          lon: '-94.0',
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await locationService.reverseGeocode({ latitude: 39.0, longitude: -94.0 });

      expect(result?.city).toBe('Smallville');
    });

    it('should fallback to display_name first element when no city/town', async () => {
      const mockResponse = {
        data: {
          address: {
            country: 'Test Country',
          },
          display_name: 'Some Place, Test Country',
          lat: '0.0',
          lon: '0.0',
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await locationService.reverseGeocode({ latitude: 0, longitude: 0 });

      expect(result?.city).toBe('Some Place');
    });

    it('should return null when API request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      const result = await locationService.reverseGeocode(berlinCoordinates);

      expect(result).toBeNull();
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should return null when response has no data', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: null });

      const result = await locationService.reverseGeocode(berlinCoordinates);

      expect(result).toBeNull();
    });
  });

  describe('searchLocation', () => {
    it('should return coordinates for valid location name', async () => {
      const mockResponse = {
        data: [
          {
            lat: '35.6586',
            lon: '139.7454',
            display_name: 'Tokyo, Japan',
          },
        ],
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await locationService.searchLocation('Tokyo');

      expect(result).toEqual({
        latitude: 35.6586,
        longitude: 139.7454,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.NOMINATIM}/search`,
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Tokyo',
            format: 'json',
            limit: 1,
          }),
          headers: {
            'User-Agent': APP_CONFIG.USER_AGENT,
          },
        })
      );
    });

    it('should return null when no results found', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      const result = await locationService.searchLocation('NonexistentPlace');

      expect(result).toBeNull();
    });

    it('should return null when API request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Search error'));

      const result = await locationService.searchLocation('Berlin');

      expect(result).toBeNull();
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should handle API response with null data', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: null });

      const result = await locationService.searchLocation('Test');

      expect(result).toBeNull();
    });
  });

  describe('searchLocations', () => {
    const mockNominatimSearchResponse = [
      {
        place_id: 123456,
        display_name: 'Berlin, Germany',
        lat: '52.5200',
        lon: '13.4050',
        type: 'city',
        importance: 0.9,
        address: {
          city: 'Berlin',
          state: 'Berlin',
          country: 'Germany',
        },
      },
      {
        place_id: 789012,
        display_name: 'Munich, Bavaria, Germany',
        lat: '48.1351',
        lon: '11.5820',
        type: 'city',
        importance: 0.85,
        address: {
          city: 'Munich',
          state: 'Bavaria',
          country: 'Germany',
        },
      },
    ];

    it('should return empty array for empty query', async () => {
      const result = await locationService.searchLocations('');
      expect(result).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await locationService.searchLocations('   ');
      expect(result).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should search locations successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockNominatimSearchResponse });

      const result = await locationService.searchLocations('Berlin', 5);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '123456',
        displayName: 'Berlin, Germany',
        primaryName: 'Berlin',
        secondaryInfo: 'Berlin, Germany',
        coordinates: {
          latitude: 52.52,
          longitude: 13.405,
        },
        type: 'city',
        importance: 0.9,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        API_ENDPOINTS.NOMINATIM_SEARCH,
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Berlin',
            format: 'json',
            limit: 5,
            addressdetails: 1,
          }),
        })
      );
    });

    it('should handle empty results from API', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      const result = await locationService.searchLocations('NonexistentPlace');

      expect(result).toEqual([]);
    });

    it('should handle null data from API', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: null });

      const result = await locationService.searchLocations('Test');

      expect(result).toEqual([]);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('timeout');
      Object.assign(timeoutError, { 
        isAxiosError: true,
        code: 'ECONNABORTED',
        config: {},
        toJSON: () => ({})
      });
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.get.mockRejectedValueOnce(timeoutError);

      const result = await locationService.searchLocations('Berlin');

      expect(result).toEqual([]);
      expect(errorNotificationService.showError).toHaveBeenCalledWith(
        expect.objectContaining({
          messageKey: 'errors.network.timeout',
        })
      );
    });

    it('should handle network offline errors', async () => {
      const networkError = new Error('Network unavailable');
      Object.assign(networkError, { 
        isAxiosError: true,
        response: null,
        config: {},
        toJSON: () => ({})
      });
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.get.mockRejectedValueOnce(networkError);

      const result = await locationService.searchLocations('Berlin');

      expect(result).toEqual([]);
      expect(errorNotificationService.showError).toHaveBeenCalledWith(
        expect.objectContaining({
          messageKey: 'errors.network.offline',
        })
      );
    });

    it('should apply rate limiting (1 req/sec)', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const start = Date.now();
      await locationService.searchLocations('First');
      await locationService.searchLocations('Second');
      const elapsed = Date.now() - start;

      // Second request should be delayed by ~1000ms
      expect(elapsed).toBeGreaterThanOrEqual(900);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    }, 3000);

    it('should trim whitespace from query', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      await locationService.searchLocations('  Berlin  ');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Berlin',
          }),
        })
      );
    });
  });

  describe('selectSearchResult', () => {
    const mockSearchResult = {
      id: '123456',
      displayName: 'Berlin, Germany',
      primaryName: 'Berlin',
      secondaryInfo: 'Berlin, Germany',
      coordinates: {
        latitude: 52.52,
        longitude: 13.405,
      },
      type: 'city',
      importance: 0.9,
    };

    it('should convert SearchResult to CityInfo', async () => {
      const result = await locationService.selectSearchResult(mockSearchResult);

      expect(result).toEqual({
        city: 'Berlin',
        country: 'Germany',
        state: 'Berlin',
        fullAddress: 'Berlin, Germany',
        latitude: 52.52,
        longitude: 13.405,
      });
    });

    it('should handle missing state in secondaryInfo', async () => {
      const resultWithoutState = {
        ...mockSearchResult,
        secondaryInfo: 'Germany',
      };

      const result = await locationService.selectSearchResult(resultWithoutState);

      expect(result).toEqual({
        city: 'Berlin',
        country: 'Germany',
        state: undefined,
        fullAddress: 'Berlin, Germany',
        latitude: 52.52,
        longitude: 13.405,
      });
    });

    it('should extract country from end of secondaryInfo', async () => {
      const resultWithState = {
        ...mockSearchResult,
        secondaryInfo: 'Bavaria, Germany',
      };

      const result = await locationService.selectSearchResult(resultWithState);

      expect(result).toEqual({
        city: 'Berlin',
        country: 'Germany',
        state: 'Bavaria',
        fullAddress: 'Berlin, Germany',
        latitude: 52.52,
        longitude: 13.405,
      });
    });
  });
});
