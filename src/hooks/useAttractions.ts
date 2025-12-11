import { useState, useCallback } from 'react';
import { Attraction, Coordinates } from '../types';
import { attractionsService, openaiService, interestsService } from '../services';

interface UseAttractionsResult {
  attractions: Attraction[];
  loading: boolean;
  error: string | null;
  loadAttractions: (coordinates: Coordinates) => Promise<void>;
  classifyAttractions: () => Promise<void>;
}

/**
 * Hook for managing attractions state
 */
export const useAttractions = (): UseAttractionsResult => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttractions = useCallback(async (coordinates: Coordinates) => {
    setLoading(true);
    setError(null);

    try {
      const userInterests = await interestsService.getInterests();
      
      // Check cache first
      const cached = await attractionsService.getCachedAttractions(
        coordinates,
        userInterests
      );
      
      if (cached) {
        setAttractions(cached);
        setLoading(false);
        return;
      }
      
      // Fetch from API
      const nearby = await attractionsService.getNearbyAttractions(coordinates);
      setAttractions(nearby);
      
      // Classify in background if user has interests
      if (userInterests.length > 0) {
        classifyInBackground(nearby, coordinates, userInterests);
      } else {
        await attractionsService.cacheAttractions(coordinates, nearby, userInterests);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attractions');
    } finally {
      setLoading(false);
    }
  }, []);

  const classifyInBackground = async (
    attractionsList: Attraction[],
    coordinates: Coordinates,
    userInterests: string[]
  ) => {
    try {
      const classified = await openaiService.classifyAttractions(
        attractionsList,
        userInterests
      );
      const sorted = attractionsService.sortByInterestScore(classified);
      setAttractions(sorted);
      await attractionsService.cacheAttractions(coordinates, sorted, userInterests);
    } catch (error) {
      console.log('Classification skipped:', error);
      await attractionsService.cacheAttractions(coordinates, attractionsList, userInterests);
    }
  };

  const classifyAttractions = useCallback(async () => {
    if (attractions.length === 0) return;

    setLoading(true);
    try {
      const userInterests = await interestsService.getInterests();
      if (userInterests.length > 0) {
        const classified = await openaiService.classifyAttractions(
          attractions,
          userInterests
        );
        const sorted = attractionsService.sortByInterestScore(classified);
        setAttractions(sorted);
      }
    } catch (err: any) {
      console.error('Classification error:', err);
    } finally {
      setLoading(false);
    }
  }, [attractions]);

  return {
    attractions,
    loading,
    error,
    loadAttractions,
    classifyAttractions,
  };
};
