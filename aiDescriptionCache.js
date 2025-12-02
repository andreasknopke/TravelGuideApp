import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_DESCRIPTION_CACHE_KEY = '@ai_description_cache';
const CACHE_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 Tage in Millisekunden
const MAX_CACHED_DESCRIPTIONS = 30; // Maximal 30 Orte cachen

// Generiere Cache-Key basierend auf Ort und Interessen
const generateCacheKey = (location, interests) => {
  const sortedInterests = [...interests].sort().join(',');
  return `${location.toLowerCase()}_${sortedInterests}`;
};

// Lade gecachte AI-Beschreibung
export const getCachedAIDescription = async (location, interests) => {
  try {
    const cacheKey = generateCacheKey(location, interests);
    const cacheData = await AsyncStorage.getItem(AI_DESCRIPTION_CACHE_KEY);
    
    if (!cacheData) {
      console.log('No AI description cache found');
      return null;
    }

    const cache = JSON.parse(cacheData);
    const cachedItem = cache[cacheKey];

    if (!cachedItem) {
      console.log('No cached AI description for:', location);
      return null;
    }

    // Prüfe ob Cache abgelaufen ist
    const now = Date.now();
    if (now - cachedItem.timestamp > CACHE_EXPIRATION_TIME) {
      console.log('Cached AI description expired for:', location);
      delete cache[cacheKey];
      await AsyncStorage.setItem(AI_DESCRIPTION_CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    console.log('Using cached AI description for:', location);
    return cachedItem.description;
  } catch (error) {
    console.error('Error reading AI description cache:', error);
    return null;
  }
};

// Speichere AI-Beschreibung im Cache
export const cacheAIDescription = async (location, interests, description) => {
  try {
    const cacheKey = generateCacheKey(location, interests);
    let cache = {};

    const existingCache = await AsyncStorage.getItem(AI_DESCRIPTION_CACHE_KEY);
    if (existingCache) {
      cache = JSON.parse(existingCache);
    }

    // Füge neue Beschreibung hinzu
    cache[cacheKey] = {
      description,
      timestamp: Date.now(),
      location,
      interests: [...interests].sort()
    };

    // Limitiere Cache-Größe - lösche älteste Einträge
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHED_DESCRIPTIONS) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toKeep = entries.slice(-MAX_CACHED_DESCRIPTIONS);
      cache = Object.fromEntries(toKeep);
    }

    await AsyncStorage.setItem(AI_DESCRIPTION_CACHE_KEY, JSON.stringify(cache));
    console.log('Cached AI description for:', location);
  } catch (error) {
    console.error('Error caching AI description:', error);
  }
};

// Lösche abgelaufene Cache-Einträge
export const clearExpiredAIDescriptions = async () => {
  try {
    const cacheData = await AsyncStorage.getItem(AI_DESCRIPTION_CACHE_KEY);
    if (!cacheData) return;

    const cache = JSON.parse(cacheData);
    const now = Date.now();
    let hasChanges = false;

    for (const key in cache) {
      if (now - cache[key].timestamp > CACHE_EXPIRATION_TIME) {
        delete cache[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await AsyncStorage.setItem(AI_DESCRIPTION_CACHE_KEY, JSON.stringify(cache));
      console.log('Cleared expired AI descriptions');
    }
  } catch (error) {
    console.error('Error clearing expired AI descriptions:', error);
  }
};
