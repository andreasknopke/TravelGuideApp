import axios from 'axios';
import { WikitravelData, SearchResult, Language } from '../types';
import { APP_CONFIG } from '../constants';
import errorNotificationService from './error-notification.service';
import { ErrorType, ErrorSource, ErrorSeverity } from '../types/errors';

/**
 * Service for Wikipedia/Wikitravel API operations
 */
class WikiService {
  /**
   * Fetch data from Wikipedia
   */
  async fetchWikipediaData(location: string, language: Language = 'de'): Promise<WikitravelData> {
    try {
      const baseUrl = `https://${language}.wikipedia.org/w/api.php`;
      
      // Normalize location name: trim and remove common suffixes
      const normalizedLocation = location
        .trim()
        .replace(/,.*$/, '') // Remove everything after comma
        .trim();
      
      const response = await axios.get(baseUrl, {
        params: {
          action: 'query',
          format: 'json',
          prop: 'extracts|pageimages|coordinates',
          exintro: true,
          explaintext: true,
          titles: normalizedLocation,
          redirects: 1,
          origin: '*',
        },
        headers: {
          'User-Agent': APP_CONFIG.USER_AGENT,
        },
        timeout: APP_CONFIG.REQUEST_TIMEOUT,
      });

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];
      
      // Page not found - try search fallback for disambiguation
      if (pageId === '-1') {
        const searchResults = await this.searchLocations(normalizedLocation, language);
        
        if (searchResults.length > 0) {
          // Retry with first search result
          const retryResponse = await axios.get(baseUrl, {
            params: {
              action: 'query',
              format: 'json',
              prop: 'extracts|pageimages|coordinates',
              exintro: true,
              explaintext: true,
              titles: searchResults[0].title,
              redirects: 1,
              origin: '*',
            },
            headers: {
              'User-Agent': APP_CONFIG.USER_AGENT,
            },
            timeout: APP_CONFIG.REQUEST_TIMEOUT,
          });
          
          const retryPages = retryResponse.data.query.pages;
          const retryPageId = Object.keys(retryPages)[0];
          
          if (retryPageId !== '-1') {
            const retryPage = retryPages[retryPageId];
            return {
              title: retryPage.title,
              extract: retryPage.extract || 'Keine Beschreibung verfügbar.',
              coordinates: retryPage.coordinates
                ? {
                    lat: retryPage.coordinates[0].lat,
                    lon: retryPage.coordinates[0].lon,
                  }
                : null,
            };
          }
        }
        
        // No results found after search fallback
        return {
          title: location,
          extract: 'Für diesen Ort sind aktuell keine detaillierten Informationen verfügbar.',
          coordinates: null,
          error: {
            code: 'NOT_FOUND',
            message: `Wikipedia article not found for "${location}"`,
            canRetry: false,
          },
        };
      }

      const page = pages[pageId];
      return {
        title: page.title,
        extract: page.extract || 'Keine Beschreibung verfügbar.',
        coordinates: page.coordinates
          ? {
              lat: page.coordinates[0].lat,
              lon: page.coordinates[0].lon,
            }
          : null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.WikiService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.timeout',
            error,
          });
          return {
            title: location,
            extract: `Informationen für "${location}" konnten nicht geladen werden.`,
            coordinates: null,
            error: {
              code: 'TIMEOUT',
              message: 'Request timed out',
              canRetry: true,
            },
          };
        } else if (!error.response) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.WikiService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.offline',
            error,
          });
          return {
            title: location,
            extract: `Informationen für "${location}" konnten nicht geladen werden.`,
            coordinates: null,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Network unavailable',
              canRetry: true,
            },
          };
        } else {
          errorNotificationService.showError({
            type: ErrorType.API,
            source: ErrorSource.WikiService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.api.wikiUnavailable',
            error,
          });
          return {
            title: location,
            extract: `Informationen für "${location}" konnten nicht geladen werden.`,
            coordinates: null,
            error: {
              code: 'API_ERROR',
              message: error.message,
              canRetry: true,
            },
          };
        }
      } else {
        errorNotificationService.showError({
          type: ErrorType.API,
          source: ErrorSource.WikiService,
          severity: ErrorSeverity.Warning,
          messageKey: 'errors.api.wikiUnavailable',
          error: error instanceof Error ? error : new Error(String(error)),
        });
        return {
          title: location,
          extract: `Informationen für "${location}" konnten nicht geladen werden.`,
          coordinates: null,
          error: {
            code: 'UNKNOWN_ERROR',
            message: error instanceof Error ? error.message : String(error),
            canRetry: false,
          },
        };
      }
    }
  }

  /**
   * Search Wikipedia locations
   */
  async searchLocations(searchTerm: string, language: Language = 'de'): Promise<SearchResult[]> {
    try {
      const baseUrl = `https://${language}.wikipedia.org/w/api.php`;
      
      const response = await axios.get(baseUrl, {
        params: {
          action: 'opensearch',
          format: 'json',
          search: searchTerm,
          limit: 10,
          origin: '*',
        },
        headers: {
          'User-Agent': APP_CONFIG.USER_AGENT,
        },
      });

      if (response.data && response.data[1]) {
        return response.data[1].map((title: string, index: number) => ({
          title,
          description: response.data[2][index] || 'Keine Beschreibung',
          url: response.data[3][index],
        }));
      }
      
      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.WikiService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.timeout',
            error,
          });
        } else if (!error.response) {
          errorNotificationService.showError({
            type: ErrorType.Network,
            source: ErrorSource.WikiService,
            severity: ErrorSeverity.Warning,
            messageKey: 'errors.network.offline',
            error,
          });
        }
      }
      return [];
    }
  }

  /**
   * Get city image from Wikipedia
   */
  async getCityImage(cityName: string, language: Language = 'de'): Promise<string | null> {
    try {
      const baseUrl = `https://${language}.wikipedia.org/w/api.php`;
      
      const response = await axios.get(baseUrl, {
        params: {
          action: 'query',
          format: 'json',
          titles: cityName,
          prop: 'pageimages',
          piprop: 'original',
          origin: '*',
        },
        headers: {
          'User-Agent': APP_CONFIG.USER_AGENT,
        },
        timeout: 8000,
      });

      const pages = response.data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1' && pages[pageId].original) {
          return pages[pageId].original.source;
        }
      }
      
      return null;
    } catch (error) {
      // Silent failure for images - not critical
      if (axios.isAxiosError(error) && !error.response) {
        errorNotificationService.logDebugInfo({
          source: ErrorSource.WikiService,
          method: 'getCityImage',
          error: 'Network error fetching city image',
        });
      }
      return null;
    }
  }
}

const wikiServiceInstance = new WikiService();

export default wikiServiceInstance;

// Export helper functions for backward compatibility
export const fetchWikitravelData = (location: string, language: string = 'de') => 
  wikiServiceInstance.fetchWikipediaData(location, language as Language);
export const getCityImage = (cityName: string) => 
  wikiServiceInstance.getCityImage(cityName);
