import { STORAGE_KEYS, AVAILABLE_INTERESTS } from '../constants';
import { Interest } from '../types';
import storageService from './storage.service';

/**
 * Service for managing user interests
 */
class InterestsService {
  /**
   * Get user interests
   */
  async getInterests(): Promise<string[]> {
    const interests = await storageService.get<string[]>(STORAGE_KEYS.INTERESTS);
    return interests || [];
  }

  /**
   * Set user interests
   */
  async setInterests(interests: string[]): Promise<boolean> {
    return storageService.set(STORAGE_KEYS.INTERESTS, interests);
  }

  /**
   * Add interest
   */
  async addInterest(interestId: string): Promise<string[]> {
    const interests = await this.getInterests();
    if (!interests.includes(interestId)) {
      const newInterests = [...interests, interestId];
      await this.setInterests(newInterests);
      return newInterests;
    }
    return interests;
  }

  /**
   * Remove interest
   */
  async removeInterest(interestId: string): Promise<string[]> {
    const interests = await this.getInterests();
    const newInterests = interests.filter(id => id !== interestId);
    await this.setInterests(newInterests);
    return newInterests;
  }

  /**
   * Get all available interests
   */
  getAvailableInterests(): readonly Interest[] {
    return AVAILABLE_INTERESTS;
  }

  /**
   * Get interest labels from IDs
   */
  getInterestLabels(interestIds: string[]): string[] {
    const labels: string[] = [];
    interestIds.forEach(id => {
      const interest = AVAILABLE_INTERESTS.find(i => i.id === id);
      if (interest?.label) {
        labels.push(interest.label);
      }
    });
    return labels;
  }

  /**
   * Clear all interests
   */
  async clearInterests(): Promise<boolean> {
    return storageService.remove(STORAGE_KEYS.INTERESTS);
  }
}

const interestsServiceInstance = new InterestsService();

// Export both the instance and helper functions
export default interestsServiceInstance;

// Helper functions for backward compatibility
export const getInterests = () => interestsServiceInstance.getInterests();
export const saveInterests = (interests: string[]) => interestsServiceInstance.setInterests(interests);
export const getInterestLabels = async (): Promise<string[]> => {
  const interests = await interestsServiceInstance.getInterests();
  return interestsServiceInstance.getInterestLabels(interests);
};
export { AVAILABLE_INTERESTS } from '../constants';
