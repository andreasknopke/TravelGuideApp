/**
 * Tests for useFavorites hook
 * Coverage target: 85%
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFavorites } from '../../src/hooks/useFavorites';
import { favoritesService } from '../../src/services';
import { createMockAttraction, mockAttractions } from '../fixtures/attractions';

jest.mock('../../src/services');

const mockedFavoritesService = favoritesService as jest.Mocked<typeof favoritesService>;

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFavoritesService.getFavorites.mockResolvedValue([]);
    mockedFavoritesService.addFavorite.mockImplementation(async (attraction) => [attraction]);
    mockedFavoritesService.removeFavorite.mockResolvedValue([]);
  });

  describe('Initial load', () => {
    it('should load favorites on mount', async () => {
      const initialFavorites = mockAttractions.slice(0, 2);
      mockedFavoritesService.getFavorites.mockResolvedValueOnce(initialFavorites);

      const { result } = renderHook(() => useFavorites());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.favorites).toEqual(initialFavorites);
      expect(result.current.favoriteIds.size).toBe(2);
      expect(mockedFavoritesService.getFavorites).toHaveBeenCalled();
    });

    it('should initialize favoriteIds as Set', async () => {
      const favorites = [
        createMockAttraction({ id: '1' }),
        createMockAttraction({ id: '2' }),
      ];
      mockedFavoritesService.getFavorites.mockResolvedValueOnce(favorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.favoriteIds.has('1')).toBe(true);
      expect(result.current.favoriteIds.has('2')).toBe(true);
      expect(result.current.favoriteIds.has('3')).toBe(false);
    });

    it('should handle load errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockedFavoritesService.getFavorites.mockRejectedValueOnce(new Error('Load error'));

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.favorites).toEqual([]);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('addFavorite', () => {
    it('should add new favorite and update state', async () => {
      mockedFavoritesService.getFavorites.mockResolvedValueOnce([]);
      
      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newAttraction = createMockAttraction({ id: '1', name: 'New Place' });
      mockedFavoritesService.addFavorite.mockResolvedValueOnce([newAttraction]);

      await act(async () => {
        await result.current.addFavorite(newAttraction);
      });

      expect(result.current.favorites).toEqual([newAttraction]);
      expect(result.current.favoriteIds.has('1')).toBe(true);
      expect(mockedFavoritesService.addFavorite).toHaveBeenCalledWith(newAttraction);
    });

    it('should update favoriteIds Set correctly', async () => {
      const existing = createMockAttraction({ id: '1' });
      mockedFavoritesService.getFavorites.mockResolvedValueOnce([existing]);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newAttraction = createMockAttraction({ id: '2' });
      mockedFavoritesService.addFavorite.mockResolvedValueOnce([existing, newAttraction]);

      await act(async () => {
        await result.current.addFavorite(newAttraction);
      });

      expect(result.current.favoriteIds.size).toBe(2);
      expect(result.current.favoriteIds.has('1')).toBe(true);
      expect(result.current.favoriteIds.has('2')).toBe(true);
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite and update state', async () => {
      const favorites = [
        createMockAttraction({ id: '1' }),
        createMockAttraction({ id: '2' }),
      ];
      mockedFavoritesService.getFavorites.mockResolvedValueOnce(favorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockedFavoritesService.removeFavorite.mockResolvedValueOnce([favorites[1]]);

      await act(async () => {
        await result.current.removeFavorite('1');
      });

      expect(result.current.favorites).toEqual([favorites[1]]);
      expect(result.current.favoriteIds.has('1')).toBe(false);
      expect(result.current.favoriteIds.has('2')).toBe(true);
      expect(mockedFavoritesService.removeFavorite).toHaveBeenCalledWith('1');
    });

    it('should handle numeric IDs', async () => {
      const favorites = [createMockAttraction({ id: 100 })];
      mockedFavoritesService.getFavorites.mockResolvedValueOnce(favorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockedFavoritesService.removeFavorite.mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.removeFavorite(100);
      });

      expect(result.current.favorites).toEqual([]);
      expect(result.current.favoriteIds.has(100)).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add favorite when not present', async () => {
      mockedFavoritesService.getFavorites.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const attraction = createMockAttraction({ id: '1' });
      mockedFavoritesService.addFavorite.mockResolvedValueOnce([attraction]);

      await act(async () => {
        await result.current.toggleFavorite(attraction);
      });

      expect(result.current.favorites).toEqual([attraction]);
      expect(mockedFavoritesService.addFavorite).toHaveBeenCalledWith(attraction);
    });

    it('should remove favorite when present', async () => {
      const attraction = createMockAttraction({ id: '1' });
      mockedFavoritesService.getFavorites.mockResolvedValueOnce([attraction]);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockedFavoritesService.removeFavorite.mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.toggleFavorite(attraction);
      });

      expect(result.current.favorites).toEqual([]);
      expect(mockedFavoritesService.removeFavorite).toHaveBeenCalledWith('1');
    });
  });

  describe('isFavorite', () => {
    it('should return true for favorite IDs', async () => {
      const favorites = [
        createMockAttraction({ id: '1' }),
        createMockAttraction({ id: '2' }),
      ];
      mockedFavoritesService.getFavorites.mockResolvedValueOnce(favorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isFavorite('1')).toBe(true);
      expect(result.current.isFavorite('2')).toBe(true);
    });

    it('should return false for non-favorite IDs', async () => {
      mockedFavoritesService.getFavorites.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isFavorite('999')).toBe(false);
    });
  });

  describe('refreshFavorites', () => {
    it('should reload favorites from service', async () => {
      const initial = [createMockAttraction({ id: '1' })];
      mockedFavoritesService.getFavorites.mockResolvedValueOnce(initial);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updated = [
        createMockAttraction({ id: '1' }),
        createMockAttraction({ id: '2' }),
      ];
      mockedFavoritesService.getFavorites.mockResolvedValueOnce(updated);

      await act(async () => {
        await result.current.refreshFavorites();
      });

      await waitFor(() => {
        expect(result.current.favorites).toEqual(updated);
        expect(result.current.favoriteIds.size).toBe(2);
      });
    });
  });
});
