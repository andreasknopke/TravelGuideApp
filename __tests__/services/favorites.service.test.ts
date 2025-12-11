/**
 * Tests for FavoritesService
 * Coverage target: 90%
 */

import favoritesService from '../../src/services/favorites.service';
import storageService from '../../src/services/storage.service';
import { STORAGE_KEYS } from '../../src/constants';
import { createMockAttraction, mockAttractions } from '../fixtures/attractions';

jest.mock('../../src/services/storage.service');

describe('FavoritesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should return favorites from storage', async () => {
      (storageService.get as jest.Mock).mockResolvedValueOnce(mockAttractions);

      const result = await favoritesService.getFavorites();

      expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.FAVORITES);
      expect(result).toEqual(mockAttractions);
    });

    it('should return empty array when no favorites exist', async () => {
      (storageService.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await favoritesService.getFavorites();

      expect(result).toEqual([]);
    });
  });

  describe('addFavorite', () => {
    it('should add new favorite to empty list', async () => {
      const newAttraction = createMockAttraction({ id: '1', name: 'New Place' });
      (storageService.get as jest.Mock).mockResolvedValueOnce(null);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await favoritesService.addFavorite(newAttraction);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ...newAttraction,
        savedAt: expect.any(String),
      });
      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.FAVORITES,
        expect.arrayContaining([expect.objectContaining({ id: '1' })])
      );
    });

    it('should add new favorite to existing list', async () => {
      const existingFavorites = [createMockAttraction({ id: '1', name: 'Place 1' })];
      const newAttraction = createMockAttraction({ id: '2', name: 'Place 2' });
      (storageService.get as jest.Mock).mockResolvedValueOnce(existingFavorites);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await favoritesService.addFavorite(newAttraction);

      expect(result).toHaveLength(2);
      expect(result[1]).toMatchObject({
        ...newAttraction,
        savedAt: expect.any(String),
      });
    });

    it('should not add duplicate favorite', async () => {
      const existingAttraction = createMockAttraction({ id: '1', name: 'Existing' });
      (storageService.get as jest.Mock).mockResolvedValueOnce([existingAttraction]);

      const result = await favoritesService.addFavorite(existingAttraction);

      expect(result).toHaveLength(1);
      expect(storageService.set).not.toHaveBeenCalled();
    });

    it('should include savedAt timestamp when adding favorite', async () => {
      const newAttraction = createMockAttraction({ id: '3' });
      (storageService.get as jest.Mock).mockResolvedValueOnce([]);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await favoritesService.addFavorite(newAttraction);

      expect(result[0]).toHaveProperty('savedAt');
      expect(typeof result[0].savedAt).toBe('string');
      expect(new Date(result[0].savedAt as string)).toBeInstanceOf(Date);
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite by ID', async () => {
      const favorites = [
        createMockAttraction({ id: '1', name: 'Keep' }),
        createMockAttraction({ id: '2', name: 'Remove' }),
        createMockAttraction({ id: '3', name: 'Keep' }),
      ];
      (storageService.get as jest.Mock).mockResolvedValueOnce(favorites);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await favoritesService.removeFavorite('2');

      expect(result).toHaveLength(2);
      expect(result.find(f => f.id === '2')).toBeUndefined();
      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.FAVORITES,
        expect.not.arrayContaining([expect.objectContaining({ id: '2' })])
      );
    });

    it('should handle removing from empty list', async () => {
      (storageService.get as jest.Mock).mockResolvedValueOnce([]);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await favoritesService.removeFavorite('999');

      expect(result).toEqual([]);
      expect(storageService.set).toHaveBeenCalledWith(STORAGE_KEYS.FAVORITES, []);
    });

    it('should handle numeric IDs', async () => {
      const favorites = [
        createMockAttraction({ id: 100, name: 'Numeric ID' }),
        createMockAttraction({ id: 200, name: 'Keep' }),
      ];
      (storageService.get as jest.Mock).mockResolvedValueOnce(favorites);
      (storageService.set as jest.Mock).mockResolvedValueOnce(true);

      const result = await favoritesService.removeFavorite(100);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(200);
    });
  });

  describe('isFavorite', () => {
    it('should return true when attraction is in favorites', async () => {
      const favorites = [createMockAttraction({ id: '1' })];
      (storageService.get as jest.Mock).mockResolvedValueOnce(favorites);

      const result = await favoritesService.isFavorite('1');

      expect(result).toBe(true);
    });

    it('should return false when attraction is not in favorites', async () => {
      const favorites = [createMockAttraction({ id: '1' })];
      (storageService.get as jest.Mock).mockResolvedValueOnce(favorites);

      const result = await favoritesService.isFavorite('999');

      expect(result).toBe(false);
    });

    it('should return false when favorites list is empty', async () => {
      (storageService.get as jest.Mock).mockResolvedValueOnce([]);

      const result = await favoritesService.isFavorite('1');

      expect(result).toBe(false);
    });
  });

  describe('clearFavorites', () => {
    it('should remove favorites from storage', async () => {
      (storageService.remove as jest.Mock).mockResolvedValueOnce(true);

      const result = await favoritesService.clearFavorites();

      expect(storageService.remove).toHaveBeenCalledWith(STORAGE_KEYS.FAVORITES);
      expect(result).toBe(true);
    });

    it('should return false when removal fails', async () => {
      (storageService.remove as jest.Mock).mockResolvedValueOnce(false);

      const result = await favoritesService.clearFavorites();

      expect(result).toBe(false);
    });
  });

  describe('getFavoriteIds', () => {
    it('should return Set of favorite IDs', async () => {
      const favorites = [
        createMockAttraction({ id: '1' }),
        createMockAttraction({ id: '2' }),
        createMockAttraction({ id: 100 }),
      ];
      (storageService.get as jest.Mock).mockResolvedValueOnce(favorites);

      const result = await favoritesService.getFavoriteIds();

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has('1')).toBe(true);
      expect(result.has('2')).toBe(true);
      expect(result.has(100)).toBe(true);
    });

    it('should return empty Set when no favorites', async () => {
      (storageService.get as jest.Mock).mockResolvedValueOnce([]);

      const result = await favoritesService.getFavoriteIds();

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });
  });
});
