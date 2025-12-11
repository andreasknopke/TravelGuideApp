/**
 * Tests for InterestsService
 * Coverage target: 90%
 */

import interestsService, { getInterests, saveInterests, getInterestLabels, AVAILABLE_INTERESTS } from '../../src/services/interests.service';
import storageService from '../../src/services/storage.service';
import { STORAGE_KEYS } from '../../src/constants';

jest.mock('../../src/services/storage.service');

describe('InterestsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInterests', () => {
    it('should return interests from storage', async () => {
      const mockInterests = ['history', 'art', 'food'];
      (storageService.get as jest.Mock).mockResolvedValueOnce(mockInterests);

      const result = await interestsService.getInterests();

      expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.INTERESTS);
      expect(result).toEqual(mockInterests);
    });

    it('should return empty array when no interests exist', async () => {
      (storageService.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await interestsService.getInterests();

      expect(result).toEqual([]);
    });
  });

  describe('setInterests', () => {
    it('should save interests to storage', async () => {
      const interests = ['history', 'nature'];
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await interestsService.setInterests(interests);

      expect(storageService.set).toHaveBeenCalledWith(STORAGE_KEYS.INTERESTS, interests);
      expect(result).toBe(true);
    });

    it('should return false when storage fails', async () => {
      (storageService.set as jest.Mock).mockResolvedValueOnce(false);

      const result = await interestsService.setInterests(['history']);

      expect(result).toBe(false);
    });
  });

  describe('addInterest', () => {
    it('should add new interest to existing list', async () => {
      const existingInterests = ['history', 'art'];
      (storageService.get as jest.Mock).mockResolvedValueOnce(existingInterests);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await interestsService.addInterest('food');

      expect(result).toEqual(['history', 'art', 'food']);
      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.INTERESTS,
        ['history', 'art', 'food']
      );
    });

    it('should not add duplicate interest', async () => {
      const existingInterests = ['history', 'art'];
      (storageService.get as jest.Mock).mockResolvedValueOnce(existingInterests);

      const result = await interestsService.addInterest('history');

      expect(result).toEqual(['history', 'art']);
      expect(storageService.set).not.toHaveBeenCalled();
    });

    it('should add interest to empty list', async () => {
      (storageService.get as jest.Mock).mockResolvedValueOnce([]);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await interestsService.addInterest('nature');

      expect(result).toEqual(['nature']);
    });
  });

  describe('removeInterest', () => {
    it('should remove interest from list', async () => {
      const interests = ['history', 'art', 'food'];
      (storageService.get as jest.Mock).mockResolvedValueOnce(interests);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await interestsService.removeInterest('art');

      expect(result).toEqual(['history', 'food']);
      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.INTERESTS,
        ['history', 'food']
      );
    });

    it('should handle removing non-existent interest', async () => {
      const interests = ['history', 'art'];
      (storageService.get as jest.Mock).mockResolvedValueOnce(interests);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await interestsService.removeInterest('nonexistent');

      expect(result).toEqual(['history', 'art']);
    });

    it('should handle removing from empty list', async () => {
      (storageService.get as jest.Mock).mockResolvedValueOnce([]);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await interestsService.removeInterest('history');

      expect(result).toEqual([]);
    });
  });

  describe('getAvailableInterests', () => {
    it('should return available interests constants', () => {
      const result = interestsService.getAvailableInterests();

      expect(result).toBe(AVAILABLE_INTERESTS);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('label');
      expect(result[0]).toHaveProperty('icon');
    });
  });

  describe('getInterestLabels', () => {
    it('should return labels for given interest IDs', () => {
      const interestIds = ['history', 'art', 'food'];

      const result = interestsService.getInterestLabels(interestIds);

      expect(result).toContain('Geschichte');
      expect(result).toContain('Kunst');
      expect(result).toContain('Essen & Trinken');
      expect(result).toHaveLength(3);
    });

    it('should skip invalid interest IDs', () => {
      const interestIds = ['history', 'invalid', 'art'];

      const result = interestsService.getInterestLabels(interestIds);

      expect(result).toHaveLength(2);
      expect(result).toContain('Geschichte');
      expect(result).toContain('Kunst');
      expect(result).not.toContain('invalid');
    });

    it('should return empty array for empty input', () => {
      const result = interestsService.getInterestLabels([]);

      expect(result).toEqual([]);
    });

    it('should handle interests without labels', () => {
      const interestIds = ['nonexistent'];

      const result = interestsService.getInterestLabels(interestIds);

      expect(result).toEqual([]);
    });
  });

  describe('clearInterests', () => {
    it('should remove interests from storage', async () => {
      (storageService.remove as jest.Mock).mockResolvedValueOnce(true);

      const result = await interestsService.clearInterests();

      expect(storageService.remove).toHaveBeenCalledWith(STORAGE_KEYS.INTERESTS);
      expect(result).toBe(true);
    });

    it('should return false when removal fails', async () => {
      (storageService.remove as jest.Mock).mockResolvedValueOnce(false);

      const result = await interestsService.clearInterests();

      expect(result).toBe(false);
    });
  });

  describe('Helper functions', () => {
    describe('getInterests', () => {
      it('should call service getInterests', async () => {
        const mockInterests = ['history'];
        (storageService.get as jest.Mock).mockResolvedValueOnce(mockInterests);

        const result = await getInterests();

        expect(result).toEqual(mockInterests);
      });
    });

    describe('saveInterests', () => {
      it('should call service setInterests', async () => {
        const interests = ['art', 'food'];
        (storageService.set as jest.Mock).mockResolvedValueOnce(true);

        const result = await saveInterests(interests);

        expect(result).toBe(true);
      });
    });

    describe('getInterestLabels', () => {
      it('should return labels for current interests', async () => {
        const mockInterests = ['history', 'art'];
        (storageService.get as jest.Mock).mockResolvedValueOnce(mockInterests);

        const result = await getInterestLabels();

        expect(result).toContain('Geschichte');
        expect(result).toContain('Kunst');
      });
    });
  });
});
