/**
 * Tests for AttractionsService
 * Coverage target: 90%
 */

import axios from 'axios';
import attractionsService, { getNearbyAttractions } from '../../src/services/attractions.service';
import storageService from '../../src/services/storage.service';
import errorNotificationService from '../../src/services/error-notification.service';
import { berlinCoordinates, tokyoCoordinates } from '../fixtures/locations';
import { createMockAttraction, mockAttractions } from '../fixtures/attractions';
import { API_ENDPOINTS, APP_CONFIG, LOCATION_CONFIG, STORAGE_KEYS, CACHE_DURATION } from '../../src/constants';

jest.mock('axios');
jest.mock('../../src/services/storage.service');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AttractionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNearbyAttractions', () => {
    it('should fetch and parse nearby attractions', async () => {
      const mockOverpassResponse = {
        data: {
          elements: [
            {
              id: 1,
              lat: 52.5163,
              lon: 13.3777,
              tags: {
                name: 'Brandenburg Gate',
                tourism: 'monument',
                description: 'Historic gate',
              },
            },
            {
              id: 2,
              lat: 52.5186,
              lon: 13.3762,
              tags: {
                name: 'Reichstag',
                historic: 'building',
              },
            },
          ],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockOverpassResponse);

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Brandenburg Gate',
        type: 'monument',
        latitude: 52.5163,
        longitude: 13.3777,
      });
      expect(result[0]).toHaveProperty('distance');
      expect(result[0]).toHaveProperty('rating');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        API_ENDPOINTS.OVERPASS,
        expect.any(String),
        expect.objectContaining({
          timeout: APP_CONFIG.REQUEST_TIMEOUT,
        })
      );
      // Verify the body contains around:5000 (or URL-encoded around%3A5000)
      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[1]).toMatch(/around%3A5000/);
    });

    it('should use custom radius', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { elements: [] } });

      await attractionsService.getNearbyAttractions(berlinCoordinates, 10000);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[1]).toMatch(/around%3A10000/);
    });

    it('should filter out elements without names', async () => {
      const mockResponse = {
        data: {
          elements: [
            {
              id: 1,
              lat: 52.5163,
              lon: 13.3777,
              tags: { name: 'With Name', tourism: 'monument' },
            },
            {
              id: 2,
              lat: 52.5186,
              lon: 13.3762,
              tags: { tourism: 'monument' }, // No name
            },
          ],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('With Name');
    });

    it('should filter out elements without coordinates', async () => {
      const mockResponse = {
        data: {
          elements: [
            {
              id: 1,
              lat: 52.5163,
              lon: 13.3777,
              tags: { name: 'Valid', tourism: 'monument' },
            },
            {
              id: 2,
              tags: { name: 'No Coords', tourism: 'monument' }, // Missing lat/lon
            },
          ],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Valid');
    });

    it('should handle elements with center coordinates', async () => {
      const mockResponse = {
        data: {
          elements: [
            {
              id: 1,
              center: { lat: 52.5163, lon: 13.3777 },
              tags: { name: 'Centered', tourism: 'attraction' },
            },
          ],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBe(52.5163);
      expect(result[0].longitude).toBe(13.3777);
    });

    it('should determine correct type from tags', async () => {
      const mockResponse = {
        data: {
          elements: [
            {
              id: 1,
              lat: 52.5,
              lon: 13.4,
              tags: { name: 'T1', tourism: 'museum' },
            },
            {
              id: 2,
              lat: 52.5,
              lon: 13.4,
              tags: { name: 'T2', historic: 'castle' },
            },
            {
              id: 3,
              lat: 52.5,
              lon: 13.4,
              tags: { name: 'T3', amenity: 'cafe' },
            },
            {
              id: 4,
              lat: 52.5,
              lon: 13.4,
              tags: { name: 'T4' }, // No specific type
            },
          ],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result[0].type).toBe('museum');
      expect(result[1].type).toBe('castle');
      expect(result[2].type).toBe('cafe');
      expect(result[3].type).toBe('attraction');
    });

    it('should sort attractions by distance', async () => {
      const mockResponse = {
        data: {
          elements: [
            {
              id: 1,
              lat: 52.52,
              lon: 13.40,
              tags: { name: 'Near', tourism: 'attraction' },
            },
            {
              id: 2,
              lat: 52.53,
              lon: 13.42,
              tags: { name: 'Far', tourism: 'attraction' },
            },
            {
              id: 3,
              lat: 52.521,
              lon: 13.405,
              tags: { name: 'Middle', tourism: 'attraction' },
            },
          ],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result[0].distance).toBeLessThan(result[1].distance);
      expect(result[1].distance).toBeLessThan(result[2].distance);
    });

    it('should limit results to MAX_ATTRACTIONS', async () => {
      const elements = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        lat: 52.52 + i * 0.001,
        lon: 13.40 + i * 0.001,
        tags: { name: `Attraction ${i}`, tourism: 'attraction' },
      }));
      mockedAxios.post.mockResolvedValueOnce({ data: { elements } });

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result.length).toBeLessThanOrEqual(LOCATION_CONFIG.MAX_ATTRACTIONS);
    });

    it('should return empty array on API error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API error'));

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result).toEqual([]);
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should return empty array when no elements in response', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { elements: [] } });

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result).toEqual([]);
    });

    it('should return empty array when response has no elements property', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const result = await attractionsService.getNearbyAttractions(berlinCoordinates);

      expect(result).toEqual([]);
    });
  });

  describe('getCachedAttractions', () => {
    it('should retrieve cached attractions with correct key', async () => {
      (storageService.getCached as jest.Mock).mockResolvedValueOnce(mockAttractions);

      const result = await attractionsService.getCachedAttractions(berlinCoordinates, ['history', 'art']);

      expect(storageService.getCached).toHaveBeenCalledWith(
        expect.stringContaining('52.52_13.40_art,history')
      );
      expect(result).toEqual(mockAttractions);
    });

    it('should sort interests in cache key for consistency', async () => {
      (storageService.getCached as jest.Mock).mockResolvedValueOnce(null);

      await attractionsService.getCachedAttractions(berlinCoordinates, ['history', 'art', 'food']);

      expect(storageService.getCached).toHaveBeenCalledWith(
        expect.stringContaining('art,food,history')
      );
    });
  });

  describe('cacheAttractions', () => {
    it('should cache attractions with correct key and duration', async () => {
      (storageService.setCached as jest.Mock).mockResolvedValueOnce(true);

      const result = await attractionsService.cacheAttractions(
        berlinCoordinates,
        mockAttractions,
        ['history']
      );

      expect(storageService.setCached).toHaveBeenCalledWith(
        expect.stringContaining('52.52_13.40_history'),
        mockAttractions,
        CACHE_DURATION.ATTRACTIONS
      );
      expect(result).toBe(true);
    });

    it('should round coordinates to 2 decimal places in cache key', async () => {
      const preciseCoords = {
        latitude: 52.5200083,
        longitude: 13.4049542,
      };
      (storageService.setCached as jest.Mock).mockResolvedValueOnce(true);

      await attractionsService.cacheAttractions(preciseCoords, mockAttractions, []);

      expect(storageService.setCached).toHaveBeenCalledWith(
        expect.stringContaining('52.52_13.40'),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('sortByInterestScore', () => {
    it('should sort attractions by interest score descending', () => {
      const attractions = [
        createMockAttraction({ id: '1', name: 'Low', interestScore: 5 }),
        createMockAttraction({ id: '2', name: 'High', interestScore: 9 }),
        createMockAttraction({ id: '3', name: 'Medium', interestScore: 7 }),
      ];

      const result = attractionsService.sortByInterestScore(attractions);

      expect(result[0].interestScore).toBe(9);
      expect(result[1].interestScore).toBe(7);
      expect(result[2].interestScore).toBe(5);
    });

    it('should handle attractions without interest scores', () => {
      const attractions = [
        createMockAttraction({ id: '1', name: 'No Score' }),
        createMockAttraction({ id: '2', name: 'Has Score', interestScore: 8 }),
      ];

      const result = attractionsService.sortByInterestScore(attractions);

      expect(result[0].id).toBe('2'); // Has score comes first
      expect(result[1].id).toBe('1');
    });

    it('should not mutate original array', () => {
      const original = [
        createMockAttraction({ id: '1', interestScore: 5 }),
        createMockAttraction({ id: '2', interestScore: 9 }),
      ];
      const originalOrder = [...original];

      attractionsService.sortByInterestScore(original);

      expect(original).toEqual(originalOrder);
    });
  });

  describe('Helper functions', () => {
    it('getNearbyAttractions should call service method', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { elements: [] } });

      const result = await getNearbyAttractions(berlinCoordinates, 3000);


      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[1]).toMatch(/around%3A3000/);
      expect(result).toEqual([]);
    });  });
});
