import { useState, useEffect, useCallback } from 'react';
import { Attraction } from '../types';
import { favoritesService } from '../services';

interface UseFavoritesResult {
  favorites: Attraction[];
  favoriteIds: Set<string | number>;
  loading: boolean;
  addFavorite: (attraction: Attraction) => Promise<void>;
  removeFavorite: (attractionId: string | number) => Promise<void>;
  toggleFavorite: (attraction: Attraction) => Promise<void>;
  isFavorite: (attractionId: string | number) => boolean;
  refreshFavorites: () => Promise<void>;
}

/**
 * Hook for managing favorites state
 */
export const useFavorites = (): UseFavoritesResult => {
  const [favorites, setFavorites] = useState<Attraction[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const favs = await favoritesService.getFavorites();
      setFavorites(favs);
      setFavoriteIds(new Set(favs.map(f => f.id)));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const addFavorite = useCallback(async (attraction: Attraction) => {
    const newFavorites = await favoritesService.addFavorite(attraction);
    setFavorites(newFavorites);
    setFavoriteIds(new Set(newFavorites.map(f => f.id)));
  }, []);

  const removeFavorite = useCallback(async (attractionId: string | number) => {
    const newFavorites = await favoritesService.removeFavorite(attractionId);
    setFavorites(newFavorites);
    setFavoriteIds(new Set(newFavorites.map(f => f.id)));
  }, []);

  const toggleFavorite = useCallback(
    async (attraction: Attraction) => {
      if (favoriteIds.has(attraction.id)) {
        await removeFavorite(attraction.id);
      } else {
        await addFavorite(attraction);
      }
    },
    [favoriteIds, addFavorite, removeFavorite]
  );

  const isFavorite = useCallback(
    (attractionId: string | number) => favoriteIds.has(attractionId),
    [favoriteIds]
  );

  return {
    favorites,
    favoriteIds,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refreshFavorites: loadFavorites,
  };
};
