/**
 * Tests for WikiService
 * Coverage target: 90%
 */

import axios from 'axios';
import wikiService, { fetchWikitravelData, getCityImage } from '../../src/services/wiki.service';
import errorNotificationService from '../../src/services/error-notification.service';
import { mockWikipediaResponse, mockWikipediaEmptyResponse } from '../fixtures/apiResponses';
import { APP_CONFIG } from '../../src/constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WikiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWikipediaData', () => {
    it('should return Wikipedia data for valid location', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockWikipediaResponse });

      const result = await wikiService.fetchWikipediaData('Brandenburg Gate');

      expect(result).toEqual({
        title: 'Brandenburg Gate',
        extract: 'The Brandenburg Gate is an 18th-century neoclassical monument in Berlin.',
        coordinates: null,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://de.wikipedia.org/w/api.php',
        expect.objectContaining({
          params: expect.objectContaining({
            action: 'query',
            titles: 'Brandenburg Gate',
            format: 'json',
          }),
        })
      );
    });

    it('should handle missing page (404)', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockWikipediaEmptyResponse });

      const result = await wikiService.fetchWikipediaData('Nonexistent');

      expect(result.title).toBe('Nonexistent');
      expect(result.extract).toContain('keine detaillierten Informationen');
      expect(result.coordinates).toBeNull();
    });

    it('should handle coordinates in response', async () => {
      const responseWithCoords = {
        query: {
          pages: {
            '1': {
              title: 'Berlin',
              extract: 'Berlin is the capital of Germany.',
              coordinates: [{ lat: 52.52, lon: 13.40 }],
            },
          },
        },
      };
      mockedAxios.get.mockResolvedValueOnce({ data: responseWithCoords });

      const result = await wikiService.fetchWikipediaData('Berlin');

      expect(result.coordinates).toEqual({
        lat: 52.52,
        lon: 13.40,
      });
    });

    it('should use specified language', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockWikipediaResponse });

      await wikiService.fetchWikipediaData('Berlin', 'en');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://en.wikipedia.org/w/api.php',
        expect.anything()
      );
    });

    it('should handle API error gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await wikiService.fetchWikipediaData('Berlin');

      expect(result.title).toBe('Berlin');
      expect(result.extract).toContain('konnten nicht geladen werden');
      expect(result.coordinates).toBeNull();
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should handle missing extract in response', async () => {
      const responseNoExtract = {
        query: {
          pages: {
            '1': {
              title: 'Test',
            },
          },
        },
      };
      mockedAxios.get.mockResolvedValueOnce({ data: responseNoExtract });

      const result = await wikiService.fetchWikipediaData('Test');

      expect(result.extract).toBe('Keine Beschreibung verfügbar.');
    });

    it('should normalize city names by removing suffixes', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockWikipediaResponse });

      await wikiService.fetchWikipediaData('Berlin, Germany');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://de.wikipedia.org/w/api.php',
        expect.objectContaining({
          params: expect.objectContaining({
            titles: 'Berlin',
          }),
        })
      );
    });

    it('should use fallback search for ambiguous titles', async () => {
      const mockSearchResponse = {
        data: [
          'Berlin',
          ['Berlin', 'Berlin, Connecticut'],
          ['Capital of Germany', 'Town in USA'],
          ['https://de.wikipedia.org/wiki/Berlin', 'https://de.wikipedia.org/wiki/Berlin_Connecticut'],
        ],
      };
      
      // First call returns page not found
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockWikipediaEmptyResponse })
        // Search fallback
        .mockResolvedValueOnce(mockSearchResponse)
        // Retry with first search result
        .mockResolvedValueOnce({ data: mockWikipediaResponse });

      const result = await wikiService.fetchWikipediaData('Berlin');

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result.title).toBe('Brandenburg Gate');
      expect(result.extract).toContain('18th-century neoclassical monument');
      expect(result.error).toBeUndefined();
    });

    it('should return error object when page not found and no search results', async () => {
      const mockEmptySearch = {
        data: ['', []],
      };
      
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockWikipediaEmptyResponse })
        .mockResolvedValueOnce(mockEmptySearch);

      const result = await wikiService.fetchWikipediaData('NonexistentCity');

      expect(result.error).toEqual({
        code: 'NOT_FOUND',
        message: 'Wikipedia article not found for "NonexistentCity"',
        canRetry: false,
      });
    });

    it('should return timeout error with canRetry true', async () => {
      const timeoutError = new Error('timeout');
      (timeoutError as any).code = 'ECONNABORTED';
      (axios.isAxiosError as jest.Mock) = jest.fn().mockReturnValue(true);
      Object.assign(timeoutError, {
        isAxiosError: true,
        config: {},
        toJSON: () => ({}),
      });
      mockedAxios.get.mockRejectedValueOnce(timeoutError);

      const result = await wikiService.fetchWikipediaData('Berlin');

      expect(result.error).toEqual({
        code: 'TIMEOUT',
        message: 'Request timed out',
        canRetry: true,
      });
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should return network error with canRetry true', async () => {
      const networkError = new Error('Network unavailable');
      (axios.isAxiosError as jest.Mock) = jest.fn().mockReturnValue(true);
      Object.assign(networkError, {
        isAxiosError: true,
        response: null,
        config: {},
        toJSON: () => ({}),
      });
      mockedAxios.get.mockRejectedValueOnce(networkError);

      const result = await wikiService.fetchWikipediaData('Berlin');

      expect(result.error).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Network unavailable',
        canRetry: true,
      });
    });

    it('should return API error with canRetry true', async () => {
      const apiError = new Error('API Error');
      (axios.isAxiosError as jest.Mock) = jest.fn().mockReturnValue(true);
      Object.assign(apiError, {
        isAxiosError: true,
        response: { status: 500 },
        message: 'Internal server error',
        config: {},
        toJSON: () => ({}),
      });
      mockedAxios.get.mockRejectedValueOnce(apiError);

      const result = await wikiService.fetchWikipediaData('Berlin');

      expect(result.error).toEqual({
        code: 'API_ERROR',
        message: 'Internal server error',
        canRetry: true,
      });
    });

    it('should handle fallback search retry failure', async () => {
      const mockSearchResponse = {
        data: [
          'Berlin',
          ['Berlin'],
          ['Capital'],
          ['https://de.wikipedia.org/wiki/Berlin'],
        ],
      };
      
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockWikipediaEmptyResponse })
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce({ data: mockWikipediaEmptyResponse });

      const result = await wikiService.fetchWikipediaData('Berlin');

      expect(result.error).toEqual({
        code: 'NOT_FOUND',
        message: 'Wikipedia article not found for "Berlin"',
        canRetry: false,
      });
    });
  });

  describe('searchLocations', () => {
    it('should return search results', async () => {
      const mockSearchResponse = {
        data: [
          'Berlin',
          ['Berlin', 'Berlin Wall', 'Berlin Cathedral'],
          ['Capital of Germany', 'Historic site', 'Church'],
          ['https://de.wikipedia.org/wiki/Berlin', 'https://de.wikipedia.org/wiki/Berlin_Wall', 'https://de.wikipedia.org/wiki/Berlin_Cathedral'],
        ],
      };
      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);

      const result = await wikiService.searchLocations('Berlin');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        title: 'Berlin',
        description: 'Capital of Germany',
        url: 'https://de.wikipedia.org/wiki/Berlin',
      });
    });

    it('should return empty array when no results', async () => {
      const mockEmptyResponse = {
        data: ['SearchTerm', []],
      };
      mockedAxios.get.mockResolvedValueOnce(mockEmptyResponse);

      const result = await wikiService.searchLocations('XYZ');

      expect(result).toEqual([]);
    });

    it('should handle API error', async () => {
      const networkError = new Error('Network Error');
      (axios.isAxiosError as jest.Mock) = jest.fn().mockReturnValue(true);
      Object.assign(networkError, { 
        isAxiosError: true,
        response: undefined,
        config: {},
        toJSON: () => ({})
      });
      mockedAxios.get.mockRejectedValueOnce(networkError);

      const result = await wikiService.searchLocations('Test');

      expect(result).toEqual([]);
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should use specified language', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: ['', []] });

      await wikiService.searchLocations('Test', 'en');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://en.wikipedia.org/w/api.php',
        expect.anything()
      );
    });
  });

  describe('getCityImage', () => {
    it('should return image URL for valid city', async () => {
      const mockImageResponse = {
        data: {
          query: {
            pages: {
              '1': {
                original: {
                  source: 'https://upload.wikimedia.org/wikipedia/commons/image.jpg',
                },
              },
            },
          },
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockImageResponse);

      const result = await wikiService.getCityImage('Berlin');

      expect(result).toBe('https://upload.wikimedia.org/wikipedia/commons/image.jpg');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://de.wikipedia.org/w/api.php',
        expect.objectContaining({
          params: expect.objectContaining({
            titles: 'Berlin',
            prop: 'pageimages',
            piprop: 'original',
          }),
          timeout: 8000,
        })
      );
    });

    it('should return null when page not found', async () => {
      const mockNoPageResponse = {
        data: {
          query: {
            pages: {
              '-1': {},
            },
          },
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockNoPageResponse);

      const result = await wikiService.getCityImage('Nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when no image available', async () => {
      const mockNoImageResponse = {
        data: {
          query: {
            pages: {
              '1': {
                title: 'Test',
              },
            },
          },
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockNoImageResponse);

      const result = await wikiService.getCityImage('Test');

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Image fetch failed'));

      const result = await wikiService.getCityImage('Berlin');

      expect(result).toBeNull();
      // getCityImage uses silent failure with logDebugInfo
    });

    it('should use specified language', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { query: { pages: {} } } });

      await wikiService.getCityImage('Test', 'en');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://en.wikipedia.org/w/api.php',
        expect.anything()
      );
    });
  });

  describe('Helper functions', () => {
    it('fetchWikitravelData should call fetchWikipediaData', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockWikipediaResponse });

      const result = await fetchWikitravelData('Berlin');

      expect(result.title).toBe('Brandenburg Gate');
    });

    it('getCityImage helper should call service method', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { query: { pages: {} } } });

      const result = await getCityImage('Berlin');

      expect(result).toBeNull();
    });
  });
});
