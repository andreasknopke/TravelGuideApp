/**
 * Tests for StorageService
 * Coverage target: 90%
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import storageService, { getCachedAIDescription, cacheAIDescription } from '../../src/services/storage.service';
import errorNotificationService from '../../src/services/error-notification.service';
import { STORAGE_KEYS } from '../../src/constants';

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed data when item exists', async () => {
      const mockData = { name: 'Test', value: 123 };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockData));

      const result = await storageService.get('test_key');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
      expect(result).toEqual(mockData);
    });

    it('should return null when item does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await storageService.get('nonexistent_key');

      expect(result).toBeNull();
    });

    it('should return null when error occurs', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await storageService.get('error_key');

      expect(result).toBeNull();
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should store stringified data and return true', async () => {
      const mockData = { name: 'Test', value: 123 };
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await storageService.set('test_key', mockData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test_key', JSON.stringify(mockData));
      expect(result).toBe(true);
    });

    it('should return false when error occurs', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await storageService.set('error_key', { data: 'test' });

      expect(result).toBe(false);
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove item and return true', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await storageService.remove('test_key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
      expect(result).toBe(true);
    });

    it('should return false when error occurs', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await storageService.remove('error_key');

      expect(result).toBe(false);
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });
  });

  describe('getCached', () => {
    it('should return cached data when cache is fresh', async () => {
      const mockData = { name: 'Test Data' };
      const cacheEntry = {
        data: mockData,
        timestamp: Date.now() - 1000, // 1 second ago
        expiresIn: 60000, // 1 minute
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cacheEntry));

      const result = await storageService.getCached('cache_key');

      expect(result).toEqual(mockData);
    });

    it('should return null and remove item when cache is expired', async () => {
      const mockData = { name: 'Expired Data' };
      const cacheEntry = {
        data: mockData,
        timestamp: Date.now() - 120000, // 2 minutes ago
        expiresIn: 60000, // 1 minute expiry
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cacheEntry));
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await storageService.getCached('expired_key');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('expired_key');
    });

    it('should return null when cached item does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await storageService.getCached('nonexistent_cache');

      expect(result).toBeNull();
    });

    it('should return null when error occurs', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Cache error'));

      const result = await storageService.getCached('error_cache');

      expect(result).toBeNull();
      // getCached calls get() which shows error notification
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });
  });

  describe('setCached', () => {
    it('should store data with cache metadata', async () => {
      const mockData = { name: 'Test' };
      const expiresIn = 60000;
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await storageService.setCached('cache_key', mockData, expiresIn);

      const expectedCacheEntry = {
        data: mockData,
        timestamp: now,
        expiresIn,
      };
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('cache_key', JSON.stringify(expectedCacheEntry));
      expect(result).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('clear', () => {
    it('should clear all storage and return true', async () => {
      (AsyncStorage.clear as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await storageService.clear();

      expect(AsyncStorage.clear).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when error occurs', async () => {
      (AsyncStorage.clear as jest.Mock).mockRejectedValueOnce(new Error('Clear error'));

      const result = await storageService.clear();

      expect(result).toBe(false);
      expect(errorNotificationService.showError).toHaveBeenCalled();
    });
  });

  describe('Helper functions', () => {
    describe('getCachedAIDescription', () => {
      it('should get AI description with correct key format', async () => {
        const location = 'Berlin';
        const interests = ['history', 'art'];
        const mockDescription = 'Test description';
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockDescription));

        const result = await getCachedAIDescription(location, interests);

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(
          `${STORAGE_KEYS.AI_DESCRIPTIONS}_${location}_${interests.sort().join(',')}`
        );
      });
    });

    describe('cacheAIDescription', () => {
      it('should cache AI description with correct key format', async () => {
        const location = 'Berlin';
        const interests = ['history', 'art'];
        const description = 'Test description';
        (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

        await cacheAIDescription(location, interests, description);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          `${STORAGE_KEYS.AI_DESCRIPTIONS}_${location}_${interests.sort().join(',')}`,
          JSON.stringify(description)
        );
      });
    });
  });
});
