export const STORAGE_KEYS = {
  FAVORITES: '@travel_guide_favorites',
  INTERESTS: '@travel_guide_interests',
  MAP_DATA: '@travel_guide_map_data',
  ATTRACTIONS_CACHE: '@travel_guide_attractions_cache',
  CITY_IMAGES: '@travel_guide_city_images',
  AI_DESCRIPTIONS: '@travel_guide_ai_descriptions',
} as const;

export const API_ENDPOINTS = {
  OVERPASS: 'https://overpass-api.de/api/interpreter',
  NOMINATIM: 'https://nominatim.openstreetmap.org',
  NOMINATIM_SEARCH: 'https://nominatim.openstreetmap.org/search',
  OPENAI: 'https://api.openai.com/v1/chat/completions',
  WIKITRAVEL: 'https://wikitravel.org/wiki',
  WIKIPEDIA: 'https://wikipedia.org/w/api.php',
} as const;

export const CACHE_DURATION = {
  ATTRACTIONS: 30 * 60 * 1000, // 30 minutes
  AI_DESCRIPTION: 7 * 24 * 60 * 60 * 1000, // 7 days
  CITY_IMAGE: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export const LOCATION_CONFIG = {
  DEFAULT_RADIUS: 5000, // meters
  DISTANCE_INTERVAL: 500, // meters
  TIME_INTERVAL: 120000, // 2 minutes
  ACCURACY: 'Balanced' as const,
  MAX_ATTRACTIONS: 20,
} as const;

export const AVAILABLE_INTERESTS = [
  { id: 'history', label: 'Geschichte', icon: '🏛️' },
  { id: 'nature', label: 'Natur', icon: '🌲' },
  { id: 'architecture', label: 'Architektur', icon: '🏰' },
  { id: 'art', label: 'Kunst', icon: '🎨' },
  { id: 'food', label: 'Essen & Trinken', icon: '🍽️' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'nightlife', label: 'Nachtleben', icon: '🌃' },
  { id: 'sports', label: 'Sport', icon: '⚽' },
  { id: 'beaches', label: 'Strände', icon: '🏖️' },
  { id: 'museums', label: 'Museen', icon: '🖼️' },
] as const;

export const APP_CONFIG = {
  USER_AGENT: 'TravelGuideApp/1.0',
  REQUEST_TIMEOUT: 20000,
  CLASSIFICATION_TIMEOUT: 20000,
  MIN_INTEREST_SCORE: 7,
  HIGH_INTEREST_SCORE: 8,
} as const;
