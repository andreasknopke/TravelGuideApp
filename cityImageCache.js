import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@travel_guide_city_images';
const CACHE_DURATION = 86400000; // 24 Stunden in Millisekunden

// Bereinige ungültige Cache-Einträge beim Start
export const cleanupInvalidCache = async () => {
  try {
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    if (!cacheJson) return;
    
    const cache = JSON.parse(cacheJson);
    let hasChanges = false;
    
    for (const cityName in cache) {
      if (!cache[cityName].imageUrl || cache[cityName].imageUrl === 'null' || cache[cityName].imageUrl === null) {
        console.log('Cleaning invalid cache entry for:', cityName);
        delete cache[cityName];
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log('City image cache cleaned');
    }
  } catch (error) {
    console.error('Error cleaning city image cache:', error);
  }
};

export const getCachedCityImage = async (cityName) => {
  try {
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    const cached = cache[cityName];
    
    if (!cached) return null;
    
    const now = Date.now();
    const isExpired = now - cached.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      console.log('City image cache expired for:', cityName);
      return null;
    }
    
    // Prüfe ob imageUrl vorhanden und gültig ist
    if (!cached.imageUrl || cached.imageUrl === 'null' || cached.imageUrl === null) {
      console.log('Invalid cached image URL for:', cityName, '- returning null');
      return null;
    }
    
    console.log('Using cached city image for:', cityName);
    return cached.imageUrl;
  } catch (error) {
    console.error('Error reading city image cache:', error);
    return null;
  }
};

export const cacheCityImage = async (cityName, imageUrl) => {
  try {
    // Cache nur wenn imageUrl nicht null/undefined ist
    if (!imageUrl) {
      console.log('Skipping cache for null/undefined image URL:', cityName);
      return;
    }
    
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    
    let cache = {};
    if (cacheJson) {
      cache = JSON.parse(cacheJson);
    }
    
    cache[cityName] = {
      imageUrl: imageUrl,
      timestamp: Date.now()
    };
    
    // Limitiere Cache-Größe auf 20 Städte
    const entries = Object.entries(cache);
    if (entries.length > 20) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache = Object.fromEntries(entries.slice(0, 20));
    }
    
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('Cached city image for:', cityName, imageUrl);
  } catch (error) {
    console.error('Error caching city image:', error);
  }
};
