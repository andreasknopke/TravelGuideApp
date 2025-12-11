export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Attraction {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  distance: number;
  rating: number;
  description?: string;
  interestScore?: number;
  interestReason?: string;
  savedAt?: string;
}

export interface CityInfo {
  city: string;
  country: string;
  state?: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

export interface WikitravelData {
  title: string;
  extract: string;
  coordinates: {
    lat: number;
    lon: number;
  } | null;
  error?: {
    code: string;
    message: string;
    canRetry: boolean;
  };
}

export interface SearchResult {
  id: string;
  displayName: string;
  primaryName: string;
  secondaryInfo: string;
  coordinates: Coordinates;
  type: string;
  importance: number;
}

export type GPSStatus = 'ACTIVE' | 'SEARCHING' | 'UNAVAILABLE' | 'PERMISSION_DENIED' | 'DISABLED';

export interface LocationSearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: ApiError | null;
  selectedResult: SearchResult | null;
}

export interface Interest {
  id: string;
  label: string;
  icon: string;
}

export interface AttractionScore {
  name: string;
  score: number;
  reason: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

export interface MapData {
  location: Coordinates;
  attractions: Attraction[];
  useGPS: boolean;
}

export type Language = 'en' | 'de';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
