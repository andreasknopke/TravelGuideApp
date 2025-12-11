import { Attraction } from '../types';
import { STORAGE_KEYS } from '../constants';
import storageService from './storage.service';

/**
 * Service for managing favorite attractions
 */
class FavoritesService {
  /**
   * Get all favorites
   */
  async getFavorites(): Promise<Attraction[]> {
    const favorites = await storageService.get<Attraction[]>(STORAGE_KEYS.FAVORITES);
    return favorites || [];
  }

  /**
   * Add attraction to favorites
   */
  async addFavorite(attraction: Attraction): Promise<Attraction[]> {
    const favorites = await this.getFavorites();
    const exists = favorites.find(fav => fav.id === attraction.id);
    
    if (!exists) {
      const newFavorites = [
        ...favorites,
        { ...attraction, savedAt: new Date().toISOString() }
      ];
      await storageService.set(STORAGE_KEYS.FAVORITES, newFavorites);
      return newFavorites;
    }
    
    return favorites;
  }

  /**
   * Remove attraction from favorites
   */
  async removeFavorite(attractionId: string | number): Promise<Attraction[]> {
    const favorites = await this.getFavorites();
    const newFavorites = favorites.filter(fav => fav.id !== attractionId);
    await storageService.set(STORAGE_KEYS.FAVORITES, newFavorites);
    return newFavorites;
  }

  /**
   * Check if attraction is in favorites
   */
  async isFavorite(attractionId: string | number): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some(fav => fav.id === attractionId);
  }

  /**
   * Clear all favorites
   */
  async clearFavorites(): Promise<boolean> {
    return storageService.remove(STORAGE_KEYS.FAVORITES);
  }

  /**
   * Get favorite IDs as Set
   */
  async getFavoriteIds(): Promise<Set<string | number>> {
    const favorites = await this.getFavorites();
    return new Set(favorites.map(f => f.id));
  }
}

export default new FavoritesService();
