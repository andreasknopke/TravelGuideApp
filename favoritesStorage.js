import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@travel_guide_favorites';

// Favoriten laden
export const getFavorites = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

// Favorit hinzufügen
export const addFavorite = async (attraction) => {
  try {
    const favorites = await getFavorites();
    const exists = favorites.find(fav => fav.id === attraction.id);
    
    if (!exists) {
      const newFavorites = [...favorites, { ...attraction, savedAt: new Date().toISOString() }];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    }
    
    return favorites;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return [];
  }
};

// Favorit entfernen
export const removeFavorite = async (attractionId) => {
  try {
    const favorites = await getFavorites();
    const newFavorites = favorites.filter(fav => fav.id !== attractionId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    return newFavorites;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return [];
  }
};

// Prüfen ob Sehenswürdigkeit favorisiert ist
export const isFavorite = async (attractionId) => {
  try {
    const favorites = await getFavorites();
    return favorites.some(fav => fav.id === attractionId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

// Alle Favoriten löschen
export const clearFavorites = async () => {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    return [];
  } catch (error) {
    console.error('Error clearing favorites:', error);
    return [];
  }
};
