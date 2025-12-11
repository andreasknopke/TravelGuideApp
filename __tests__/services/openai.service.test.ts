/**
 * Tests for OpenAIService
 * Coverage target: 90%
 */

import axios from 'axios';
import openAIService, { fetchLLMDescription } from '../../src/services/openai.service';
import storageService from '../../src/services/storage.service';
import errorNotificationService from '../../src/services/error-notification.service';
import config from '../../src/config';
import { createMockAttraction, mockAttractions } from '../fixtures/attractions';
import { mockOpenAIClassificationResponse, mockOpenAIDescriptionResponse, mockOpenAIErrorResponse } from '../fixtures/apiResponses';
import { API_ENDPOINTS, APP_CONFIG, STORAGE_KEYS, CACHE_DURATION } from '../../src/constants';

jest.mock('axios');
jest.mock('../../src/services/storage.service');
jest.mock('../../src/config');
jest.mock('../../src/config/i18n', () => ({
  __esModule: true,
  default: {
    language: 'de'
  }
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedConfig = config as jest.Mocked<typeof config>;

describe('OpenAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConfig.get.mockReturnValue('sk-test-key-12345');
  });

  describe('classifyAttractions', () => {
    it('should return attractions unchanged when no interests', async () => {
      const result = await openAIService.classifyAttractions(mockAttractions, []);

      expect(result).toEqual(mockAttractions);
      expect(mockedAxios).not.toHaveBeenCalled();
    });

    it('should return attractions unchanged when invalid API key', async () => {
      mockedConfig.get.mockReturnValue('invalid-key');

      const result = await openAIService.classifyAttractions(mockAttractions, ['history']);

      expect(result).toEqual(mockAttractions);
      expect(mockedAxios).not.toHaveBeenCalled();
    });

    it('should classify attractions with interest scores', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify([
                  { name: 'Brandenburg Gate', score: 9, reason: 'Historic monument' },
                  { name: 'Reichstag', score: 8, reason: 'Political history' },
                  { name: 'Berlin Cathedral', score: 7, reason: 'Architecture' },
                ]),
              },
            },
          ],
        },
      };
      (mockedAxios as any).mockResolvedValueOnce(mockResponse);

      const result = await openAIService.classifyAttractions(mockAttractions, ['history', 'architecture']);

      expect(result[0]).toHaveProperty('interestScore', 9);
      expect(result[0]).toHaveProperty('interestReason', 'Historic monument');
      expect(result[1]).toHaveProperty('interestScore', 8);
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: API_ENDPOINTS.OPENAI,
          data: expect.objectContaining({
            model: 'gpt-4o-mini',
            temperature: 0.3,
          }),
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test-key-12345',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle markdown code blocks in response', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: '```json\n[{"name": "Brandenburg Gate", "score": 9, "reason": "Test"}]\n```',
              },
            },
          ],
        },
      };
      (mockedAxios as any).mockResolvedValueOnce(mockResponse);

      const result = await openAIService.classifyAttractions(mockAttractions.slice(0, 1), ['history']);

      expect(result[0].interestScore).toBe(9);
    });

    it('should handle API errors gracefully', async () => {
      (mockedAxios as any).mockRejectedValueOnce(new Error('API Error'));

      const result = await openAIService.classifyAttractions(mockAttractions, ['history']);

      expect(result).toEqual(mockAttractions);
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });

    it('should handle malformed JSON in response', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Invalid JSON',
              },
            },
          ],
        },
      };
      (mockedAxios as any).mockResolvedValueOnce(mockResponse);

      const result = await openAIService.classifyAttractions(mockAttractions, ['history']);

      // When JSON parsing fails, attractions get default scores added
      expect(result).toHaveLength(mockAttractions.length);
      result.forEach(attraction => {
        expect(attraction).toHaveProperty('interestScore', 5);
        expect(attraction).toHaveProperty('interestReason', '');
      });
      // JSON parsing errors are logged to console but don't trigger error notifications
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should assign default score when attraction not in response', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify([
                  { name: 'Brandenburg Gate', score: 9, reason: 'Historic' },
                ]),
              },
            },
          ],
        },
      };
      (mockedAxios as any).mockResolvedValueOnce(mockResponse);

      const result = await openAIService.classifyAttractions(mockAttractions, ['history']);

      expect(result[1].interestScore).toBe(5); // Default score
      expect(result[2].interestScore).toBe(5);
    });
  });

  describe('getDescription', () => {
    it('should return AI description for location', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Berlin ist die Hauptstadt von Deutschland...',
              },
            },
          ],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await openAIService.getDescription('Berlin', 'History context');

      expect(result).toBe('Berlin ist die Hauptstadt von Deutschland...');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        API_ENDPOINTS.OPENAI,
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 500,
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ 
              role: 'user',
              content: expect.stringContaining('Berlin'),
            }),
          ]),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test-key-12345',
          }),
        })
      );
    });

    it('should return error message when API key is invalid', async () => {
      mockedConfig.get.mockReturnValue('invalid');

      const result = await openAIService.getDescription('Berlin');

      expect(result).toContain('nicht konfiguriert');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle rate limit error (429)', async () => {
      const error = {
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } },
        },
      };
      mockedAxios.post.mockRejectedValueOnce(error);

      const result = await openAIService.getDescription('Berlin');

      expect(result).toContain('zu viele API-Anfragen');
    });

    it('should handle unauthorized error (401)', async () => {
      const error = {
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } },
        },
      };
      mockedAxios.post.mockRejectedValueOnce(error);

      const result = await openAIService.getDescription('Berlin');

      expect(result).toContain('API-Schlüssel ungültig');
    });

    it('should handle generic error', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: { message: 'Internal server error' } },
        },
      };
      mockedAxios.post.mockRejectedValueOnce(error);

      const result = await openAIService.getDescription('Berlin');

      expect(result).toContain('Fehler beim Abrufen');
      expect(result).toContain('Internal server error');
    });

    it('should handle network error without response', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValueOnce(error);

      const result = await openAIService.getDescription('Berlin');

      expect(result).toContain('Fehler beim Abrufen');
      expect(result).toContain('Network error');
    });
  });

  describe('getCachedDescription', () => {
    it('should retrieve cached description', async () => {
      const mockDescription = 'Cached description';
      (storageService.getCached as jest.Mock).mockResolvedValueOnce(mockDescription);

      const result = await openAIService.getCachedDescription('Berlin', ['history', 'art']);

      expect(storageService.getCached).toHaveBeenCalledWith(
        `${STORAGE_KEYS.AI_DESCRIPTIONS}_Berlin_history,art`
      );
      expect(result).toBe(mockDescription);
    });
  });

  describe('cacheDescription', () => {
    it('should cache description with correct key and duration', async () => {
      (storageService.setCached as jest.Mock).mockResolvedValueOnce(true);

      const result = await openAIService.cacheDescription('Berlin', ['history'], 'Test description');

      expect(storageService.setCached).toHaveBeenCalledWith(
        `${STORAGE_KEYS.AI_DESCRIPTIONS}_Berlin_history`,
        'Test description',
        CACHE_DURATION.AI_DESCRIPTION
      );
      expect(result).toBe(true);
    });
  });

  describe('Helper functions', () => {
    it('fetchLLMDescription should call service getDescription', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Test' } }],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await fetchLLMDescription('Berlin', 'context');

      expect(result).toBe('Test');
    });
  });
});
