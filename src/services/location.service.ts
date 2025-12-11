import * as Location from 'expo-location';
import axios from 'axios';
import { Coordinates, CityInfo, SearchResult } from '../types';
import { API_ENDPOINTS, APP_CONFIG } from '../constants';
import errorNotificationService from './error-notification.service';
import { ErrorType, ErrorSource, ErrorSeverity } from '../types/errors';

/**
 * Service for location-related operations
 */
class LocationService {
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 1000; // 1 request per second for Nominatim
  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      
      if (!granted) {
        errorNotificationService.showError({
          type: ErrorType.Permission,
          source: ErrorSource.LocationService,
          severity: ErrorSeverity.Critical,
          messageKey: 'errors.location.permissionDenied',
          onOpenSettings: true,
        });
      }
      
      return granted;
    } catch (error) {
      errorNotificationService.showError({
        type: ErrorType.Permission,
        source: ErrorSource.LocationService,
        severity: ErrorSeverity.Critical,
        messageKey: 'errors.location.permissionDenied',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        // Error already shown by requestPermissions
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return location;
    } catch (error) {
      errorNotificationService.showError({
        type: ErrorType.Location,
        source: ErrorSource.LocationService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.location.notAvailable',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return null;
    }
  }

  /**
   * Watch position changes
   */
  async watchPosition(
    callback: (location: Location.LocationObject) => void,
    options?: Location.LocationOptions
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        // Error already shown by requestPermissions
        return null;
      }

      return await Location.watchPositionAsync(
        options || {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 500,
          timeInterval: 120000,
        },
        callback
      );
    } catch (error) {
      errorNotificationService.showError({
        type: ErrorType.Location,
        source: ErrorSource.LocationService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.location.notAvailable',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to city info
   */
  async reverseGeocode(coordinates: Coordinates): Promise<CityInfo | null> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.NOMINATIM}/reverse`, {
        params: {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          format: 'json',
          'accept-language': 'de',
        },
        headers: {
          'User-Agent': APP_CONFIG.USER_AGENT,
        },
      });

      if (response.data) {
        const address = response.data.address;
        
        const cityName =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          response.data.display_name.split(',')[0];
        
        return {
          city: cityName,
          country: address.country,
          state: address.state,
          fullAddress: response.data.display_name,
          latitude: parseFloat(response.data.lat),
          longitude: parseFloat(response.data.lon),
        };
      }
      
      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.timeout',
            error,
          });
        } else if (!error.response) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.offline',
            error,
          });
        } else {
          errorNotificationService.showError({
            type: ErrorType.API,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.api.genericError',
            error,
          });
        }
      } else {
        errorNotificationService.showError({
          type: ErrorType.API,
          source: ErrorSource.LocationService,
          severity: ErrorSeverity.Warning,
          messageKey: 'errors.api.genericError',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
      return null;
    }
  }

  /**
   * Search location by name
   */
  async searchLocation(locationName: string): Promise<Coordinates | null> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.NOMINATIM}/search`, {
        params: {
          q: locationName,
          format: 'json',
          limit: 1,
          'accept-language': 'de',
        },
        headers: {
          'User-Agent': APP_CONFIG.USER_AGENT,
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        };
      }
      
      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.timeout',
            error,
          });
        } else if (!error.response) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.offline',
            error,
          });
        } else {
          errorNotificationService.showError({
            type: ErrorType.API,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.api.genericError',
            error,
          });
        }
      } else {
        errorNotificationService.showError({
          type: ErrorType.API,
          source: ErrorSource.LocationService,
          severity: ErrorSeverity.Warning,
          messageKey: 'errors.api.genericError',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
      return null;
    }
  }

  /**
   * Apply rate limiting for Nominatim API (1 request per second)
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Search locations by query string
   * @param query - Search query (city name, address, etc.)
   * @param limit - Maximum number of results (default: 5)
   * @returns Array of search results
   */
  async searchLocations(query: string, limit: number = 5): Promise<SearchResult[]> {
    // Validate input
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      // Apply rate limiting
      await this.applyRateLimit();

      const response = await axios.get(API_ENDPOINTS.NOMINATIM_SEARCH, {
        params: {
          q: query.trim(),
          format: 'json',
          limit,
          'accept-language': 'de',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': APP_CONFIG.USER_AGENT,
        },
        timeout: APP_CONFIG.REQUEST_TIMEOUT,
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      // Transform Nominatim results to SearchResult format
      return response.data.map((item: any) => {
        const address = item.address || {};
        
        // Extract primary name (city, town, village)
        const primaryName = address.city || 
                           address.town || 
                           address.village || 
                           address.municipality ||
                           item.name ||
                           item.display_name.split(',')[0];

        // Extract secondary info (state, country)
        const secondaryParts = [];
        if (address.state) secondaryParts.push(address.state);
        if (address.country) secondaryParts.push(address.country);
        const secondaryInfo = secondaryParts.join(', ');

        return {
          id: item.place_id.toString(),
          displayName: item.display_name,
          primaryName,
          secondaryInfo,
          coordinates: {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          },
          type: item.type || 'unknown',
          importance: parseFloat(item.importance || '0'),
        };
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.timeout',
            error,
          });
        } else if (!error.response) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.offline',
            error,
          });
        } else {
          errorNotificationService.showError({
            type: ErrorType.API,
            source: ErrorSource.LocationService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.api.genericError',
            error,
          });
        }
      } else {
        errorNotificationService.showError({
          type: ErrorType.API,
          source: ErrorSource.LocationService,
          severity: ErrorSeverity.Warning,
          messageKey: 'errors.api.genericError',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
      return [];
    }
  }

  /**
   * Convert a SearchResult to CityInfo format
   * @param result - The selected search result
   * @returns CityInfo object for the selected location
   */
  async selectSearchResult(result: SearchResult): Promise<CityInfo> {
    const parts = result.secondaryInfo.split(', ');
    const hasMultipleParts = parts.length > 1;
    
    return {
      city: result.primaryName,
      country: parts[parts.length - 1] || '',
      state: hasMultipleParts ? parts[0] : undefined,
      fullAddress: result.displayName,
      latitude: result.coordinates.latitude,
      longitude: result.coordinates.longitude,
    };
  }
}

export default new LocationService();
