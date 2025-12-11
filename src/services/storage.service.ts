import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheEntry } from '../types';
import { STORAGE_KEYS } from '../constants';
import errorNotificationService from './error-notification.service';
import { ErrorType, ErrorSource, ErrorSeverity } from '../types/errors';

/**
 * Generic storage service for AsyncStorage operations
 */
class StorageService {
  /**
   * Get item from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      errorNotificationService.showError({
        type: ErrorType.Storage,
        source: ErrorSource.StorageService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.storage.loadFailed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return null;
    }
  }

  /**
   * Set item in storage
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      errorNotificationService.showError({
        type: ErrorType.Storage,
        source: ErrorSource.StorageService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.storage.saveFailed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      errorNotificationService.showError({
        type: ErrorType.Storage,
        source: ErrorSource.StorageService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.storage.deleteFailed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  }

  /**
   * Get cached data with expiration check
   */
  async getCached<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.get<CacheEntry<T>>(key);
      if (!cached) return null;

      const now = Date.now();
      if (now - cached.timestamp > cached.expiresIn) {
        await this.remove(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      // Silent failure for cache - not critical
      errorNotificationService.logDebugInfo({
        source: ErrorSource.StorageService,
        method: 'getCached',
        key,
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Set cached data with expiration
   */
  async setCached<T>(key: string, data: T, expiresIn: number): Promise<boolean> {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };
    return this.set(key, cacheEntry);
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      errorNotificationService.showError({
        type: ErrorType.Storage,
        source: ErrorSource.StorageService,
        severity: ErrorSeverity.Warning,
        messageKey: 'errors.storage.deleteFailed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  }
}

const storageServiceInstance = new StorageService();

export default storageServiceInstance;

// Export helper functions for backward compatibility
export const getCachedAIDescription = (location: string, interests: string[]) => 
  storageServiceInstance.get<string>(`${STORAGE_KEYS.AI_DESCRIPTIONS}_${location}_${interests.sort().join(',')}`);
export const cacheAIDescription = (location: string, interests: string[], description: string) => 
  storageServiceInstance.set(`${STORAGE_KEYS.AI_DESCRIPTIONS}_${location}_${interests.sort().join(',')}`, description);
