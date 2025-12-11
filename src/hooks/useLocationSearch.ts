import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationSearchState, SearchResult, CityInfo } from '../types';
import locationService from '../services/location.service';

/**
 * Hook for managing location search state with debouncing
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 */
export function useLocationSearch(debounceMs: number = 300) {
  const [state, setState] = useState<LocationSearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    selectedResult: null,
  });

  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Set search query and trigger debounced search
   */
  const setQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      query,
      loading: query.trim().length > 0,
      error: null,
    }));

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear results if query is empty
    if (query.trim().length === 0) {
      setState(prev => ({
        ...prev,
        results: [],
        loading: false,
        error: null,
      }));
      return;
    }

    // Debounce the search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);
  }, [debounceMs]);

  /**
   * Perform the actual search
   */
  const performSearch = async (query: string) => {
    if (query.trim().length === 0) {
      return;
    }

    try {
      abortControllerRef.current = new AbortController();
      
      const results = await locationService.searchLocations(query.trim(), 5);
      
      setState(prev => ({
        ...prev,
        results,
        loading: false,
        error: null,
      }));
    } catch (error) {
      // Only update error if request wasn't aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          results: [],
          loading: false,
          error: {
            message: error.message,
            code: 'SEARCH_ERROR',
          },
        }));
      }
    }
  };

  /**
   * Select a search result
   */
  const selectResult = useCallback((result: SearchResult) => {
    setState(prev => ({
      ...prev,
      selectedResult: result,
      query: result.primaryName,
      results: [],
    }));
  }, []);

  /**
   * Clear search state
   */
  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      query: '',
      results: [],
      loading: false,
      error: null,
      selectedResult: null,
    });
  }, []);

  /**
   * Get CityInfo from selected result
   */
  const getSelectedCityInfo = useCallback(async (): Promise<CityInfo | null> => {
    if (!state.selectedResult) {
      return null;
    }
    
    return await locationService.selectSearchResult(state.selectedResult);
  }, [state.selectedResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query: state.query,
    results: state.results,
    loading: state.loading,
    error: state.error,
    selectedResult: state.selectedResult,
    setQuery,
    selectResult,
    clearSearch,
    getSelectedCityInfo,
  };
}
