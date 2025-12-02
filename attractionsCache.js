import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@travel_guide_attractions_cache';
const CACHE_DURATION = 3600000; // 1 Stunde in Millisekunden

// Cache-Struktur: { "lat,lng": { data: [...], timestamp: 123456, interests: [...] } }

export const getCachedAttractions = async (latitude, longitude, userInterests) => {
  try {
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`; // 3 Dezimalstellen = ca. 111m Genauigkeit
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    const cached = cache[cacheKey];
    
    if (!cached) return null;
    
    const now = Date.now();
    const isExpired = now - cached.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      console.log('Cache expired for location:', cacheKey);
      return null;
    }
    
    // Prüfe ob Interessen sich geändert haben
    const interestsChanged = JSON.stringify(cached.interests) !== JSON.stringify(userInterests);
    if (interestsChanged) {
      console.log('Interests changed, cache invalid');
      return null;
    }
    
    console.log('Using cached attractions for:', cacheKey, '- Age:', Math.round((now - cached.timestamp) / 60000), 'minutes');
    return cached.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

export const cacheAttractions = async (latitude, longitude, attractions, userInterests) => {
  try {
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    
    let cache = {};
    if (cacheJson) {
      cache = JSON.parse(cacheJson);
    }
    
    cache[cacheKey] = {
      data: attractions,
      timestamp: Date.now(),
      interests: userInterests
    };
    
    // Limitiere Cache-Größe: behalte nur die neuesten 10 Einträge
    const entries = Object.entries(cache);
    if (entries.length > 10) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache = Object.fromEntries(entries.slice(0, 10));
    }
    
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('Cached attractions for:', cacheKey);
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

export const clearAttractionsCache = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('Attractions cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
