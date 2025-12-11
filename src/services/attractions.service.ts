import axios from 'axios';
import { Attraction, Coordinates } from '../types';
import { API_ENDPOINTS, APP_CONFIG, LOCATION_CONFIG, STORAGE_KEYS, CACHE_DURATION } from '../constants';
import { calculateDistance } from '../utils/distance';
import storageService from './storage.service';
import errorNotificationService from './error-notification.service';
import { ErrorType, ErrorSource, ErrorSeverity } from '../types/errors';

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: {
    name?: string;
    tourism?: string;
    historic?: string;
    amenity?: string;
    description?: string;
    'wikipedia:de'?: string;
  };
}

/**
 * Service for fetching and managing attractions
 */
class AttractionsService {
  /**
   * Get nearby attractions from Overpass API
   */
  async getNearbyAttractions(
    coordinates: Coordinates,
    radius: number = LOCATION_CONFIG.DEFAULT_RADIUS
  ): Promise<Attraction[]> {
    try {
      const query = `
        [out:json][timeout:20];
        (
          node["tourism"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          node["historic"](around:${radius},${coordinates.latitude},${coordinates.longitude});
        );
        out center 30;
      `;

      const response = await axios.post(
        API_ENDPOINTS.OVERPASS,
        `data=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: APP_CONFIG.REQUEST_TIMEOUT,
        }
      );

      if (response.data?.elements) {
        return this.parseOverpassElements(response.data.elements, coordinates);
      }

      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.AttractionsService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.timeout',
            error,
          });
        } else if (!error.response) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.AttractionsService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.offline',
            error,
          });
        } else {
          errorNotificationService.showError({
            type: ErrorType.API,
            source: ErrorSource.AttractionsService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.api.attractionsUnavailable',
            error,
          });
        }
      } else {
        errorNotificationService.showError({
          type: ErrorType.API,
          source: ErrorSource.AttractionsService,
          severity: ErrorSeverity.Warning,
          messageKey: 'errors.api.attractionsUnavailable',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
      return [];
    }
  }

  /**
   * Parse Overpass API elements to Attraction objects
   */
  private parseOverpassElements(
    elements: OverpassElement[],
    userLocation: Coordinates
  ): Attraction[] {
    const attractions = elements
      .filter(element => element.tags?.name)
      .map((element, index) => {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        
        if (!lat || !lon) return null;
        
        const distance = calculateDistance(
          userLocation,
          { latitude: lat, longitude: lon }
        );
        
        let type = 'attraction';
        if (element.tags.tourism) type = element.tags.tourism;
        else if (element.tags.historic) type = element.tags.historic;
        else if (element.tags.amenity) type = element.tags.amenity;
        
        return {
          id: element.id || index,
          name: element.tags.name!,
          latitude: lat,
          longitude: lon,
          type,
          distance: Math.round(distance),
          rating: 4.0 + Math.random() * 1.0,
          description: element.tags.description || element.tags['wikipedia:de'] || '',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, LOCATION_CONFIG.MAX_ATTRACTIONS);
    
    return attractions;
  }

  /**
   * Get cached attractions
   */
  async getCachedAttractions(
    coordinates: Coordinates,
    interests: string[]
  ): Promise<Attraction[] | null> {
    const cacheKey = this.getCacheKey(coordinates, interests);
    return storageService.getCached<Attraction[]>(cacheKey);
  }

  /**
   * Cache attractions
   */
  async cacheAttractions(
    coordinates: Coordinates,
    attractions: Attraction[],
    interests: string[]
  ): Promise<boolean> {
    const cacheKey = this.getCacheKey(coordinates, interests);
    return storageService.setCached(
      cacheKey,
      attractions,
      CACHE_DURATION.ATTRACTIONS
    );
  }

  /**
   * Generate cache key for attractions
   */
  private getCacheKey(coordinates: Coordinates, interests: string[]): string {
    const lat = coordinates.latitude.toFixed(2);
    const lng = coordinates.longitude.toFixed(2);
    const interestsKey = interests.sort().join(',');
    return `${STORAGE_KEYS.ATTRACTIONS_CACHE}_${lat}_${lng}_${interestsKey}`;
  }

  /**
   * Sort attractions by interest score
   */
  sortByInterestScore(attractions: Attraction[]): Attraction[] {
    return [...attractions].sort(
      (a, b) => (b.interestScore || 0) - (a.interestScore || 0)
    );
  }
}

const attractionsServiceInstance = new AttractionsService();

export default attractionsServiceInstance;

// Export helper function for backward compatibility
export const getNearbyAttractions = (coordinates: Coordinates, radius?: number) => 
  attractionsServiceInstance.getNearbyAttractions(coordinates, radius);
