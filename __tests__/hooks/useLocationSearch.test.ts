/**
 * Tests for useLocationSearch hook
 * Coverage target: 85%
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLocationSearch } from '../../src/hooks/useLocationSearch';
import locationService from '../../src/services/location.service';
import { SearchResult } from '../../src/types';

jest.mock('../../src/services/location.service');
const mockedLocationService = locationService as jest.Mocked<typeof locationService>;

describe('useLocationSearch', () => {
  const mockSearchResults: SearchResult[] = [
    {
      id: '1',
      displayName: 'Berlin, Germany',
      primaryName: 'Berlin',
      secondaryInfo: 'Berlin, Germany',
      coordinates: { latitude: 52.52, longitude: 13.405 },
      type: 'city',
      importance: 0.9,
    },
    {
      id: '2',
      displayName: 'Munich, Bavaria, Germany',
      primaryName: 'Munich',
      secondaryInfo: 'Bavaria, Germany',
      coordinates: { latitude: 48.1351, longitude: 11.582 },
      type: 'city',
      importance: 0.85,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useLocationSearch());

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.selectedResult).toBeNull();
  });

  it('should update query and set loading state', () => {
    const { result } = renderHook(() => useLocationSearch());

    act(() => {
      result.current.setQuery('Berlin');
    });

    expect(result.current.query).toBe('Berlin');
    expect(result.current.loading).toBe(true);
  });

  it('should debounce search by 300ms', async () => {
    mockedLocationService.searchLocations.mockResolvedValue(mockSearchResults);
    const { result } = renderHook(() => useLocationSearch(300));

    act(() => {
      result.current.setQuery('Ber');
    });

    expect(mockedLocationService.searchLocations).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(mockedLocationService.searchLocations).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockedLocationService.searchLocations).toHaveBeenCalledWith('Ber', 5);
    });
  });

  it('should cancel previous search when query changes', async () => {
    mockedLocationService.searchLocations.mockResolvedValue(mockSearchResults);
    const { result } = renderHook(() => useLocationSearch(300));

    act(() => {
      result.current.setQuery('Ber');
    });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    act(() => {
      result.current.setQuery('Berlin');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockedLocationService.searchLocations).toHaveBeenCalledTimes(1);
      expect(mockedLocationService.searchLocations).toHaveBeenCalledWith('Berlin', 5);
    });
  });

  it('should search and update results', async () => {
    mockedLocationService.searchLocations.mockResolvedValue(mockSearchResults);
    const { result } = renderHook(() => useLocationSearch(300));

    act(() => {
      result.current.setQuery('Berlin');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockSearchResults);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle search errors', async () => {
    const searchError = new Error('Search failed');
    mockedLocationService.searchLocations.mockRejectedValue(searchError);
    const { result } = renderHook(() => useLocationSearch(300));

    act(() => {
      result.current.setQuery('Berlin');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.error).toEqual({
        message: 'Search failed',
        code: 'SEARCH_ERROR',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.results).toEqual([]);
    });
  });

  it('should clear results when query is empty', () => {
    mockedLocationService.searchLocations.mockResolvedValue(mockSearchResults);
    const { result } = renderHook(() => useLocationSearch());

    act(() => {
      result.current.setQuery('Berlin');
    });

    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockedLocationService.searchLocations).not.toHaveBeenCalled();
  });

  it('should clear results when query is whitespace', () => {
    const { result } = renderHook(() => useLocationSearch());

    act(() => {
      result.current.setQuery('   ');
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should select a result', () => {
    const { result } = renderHook(() => useLocationSearch());

    act(() => {
      result.current.selectResult(mockSearchResults[0]);
    });

    expect(result.current.selectedResult).toEqual(mockSearchResults[0]);
    expect(result.current.query).toBe('Berlin');
    expect(result.current.results).toEqual([]);
  });

  it('should clear all search state', async () => {
    mockedLocationService.searchLocations.mockResolvedValue(mockSearchResults);
    const { result } = renderHook(() => useLocationSearch(300));

    act(() => {
      result.current.setQuery('Berlin');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.selectResult(mockSearchResults[0]);
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.selectedResult).toBeNull();
  });

  it('should get CityInfo from selected result', async () => {
    const mockCityInfo = {
      city: 'Berlin',
      country: 'Germany',
      state: 'Berlin',
      fullAddress: 'Berlin, Germany',
      latitude: 52.52,
      longitude: 13.405,
    };
    mockedLocationService.selectSearchResult.mockResolvedValue(mockCityInfo);
    const { result } = renderHook(() => useLocationSearch());

    act(() => {
      result.current.selectResult(mockSearchResults[0]);
    });

    const cityInfo = await result.current.getSelectedCityInfo();

    expect(cityInfo).toEqual(mockCityInfo);
    expect(mockedLocationService.selectSearchResult).toHaveBeenCalledWith(mockSearchResults[0]);
  });

  it('should return null from getSelectedCityInfo when no result selected', async () => {
    const { result } = renderHook(() => useLocationSearch());

    const cityInfo = await result.current.getSelectedCityInfo();

    expect(cityInfo).toBeNull();
    expect(mockedLocationService.selectSearchResult).not.toHaveBeenCalled();
  });

  it('should use custom debounce time', async () => {
    mockedLocationService.searchLocations.mockResolvedValue(mockSearchResults);
    const { result } = renderHook(() => useLocationSearch(500));

    act(() => {
      result.current.setQuery('Berlin');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockedLocationService.searchLocations).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(mockedLocationService.searchLocations).toHaveBeenCalledWith('Berlin', 5);
    });
  });

  it('should cleanup timers and abort controllers on unmount', () => {
    const { result, unmount } = renderHook(() => useLocationSearch());

    act(() => {
      result.current.setQuery('Berlin');
    });

    unmount();

    // Should not throw errors after unmount
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(300);
      });
    }).not.toThrow();
  });

  it('should not update state for aborted requests', async () => {
    let resolveSearch: (value: SearchResult[]) => void;
    const searchPromise = new Promise<SearchResult[]>((resolve) => {
      resolveSearch = resolve;
    });
    mockedLocationService.searchLocations.mockReturnValue(searchPromise);

    const { result } = renderHook(() => useLocationSearch(300));

    act(() => {
      result.current.setQuery('Berlin');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Start new search before first completes
    act(() => {
      result.current.setQuery('Munich');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Resolve first search (should be ignored)
    await act(async () => {
      resolveSearch!(mockSearchResults);
    });

    // State should still reflect the second search
    expect(result.current.query).toBe('Munich');
  });
});
