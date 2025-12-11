/**
 * Tests for useAttractions hook
 * Coverage target: 85%
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAttractions } from '../../src/hooks/useAttractions';
import { attractionsService, openaiService, interestsService } from '../../src/services';
import { berlinCoordinates } from '../fixtures/locations';
import { mockAttractions, createMockAttraction } from '../fixtures/attractions';

jest.mock('../../src/services');

const mockedAttractionsService = attractionsService as jest.Mocked<typeof attractionsService>;
const mockedOpenAIService = openaiService as jest.Mocked<typeof openaiService>;
const mockedInterestsService = interestsService as jest.Mocked<typeof interestsService>;

describe('useAttractions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedInterestsService.getInterests.mockResolvedValue([]);
    mockedAttractionsService.getCachedAttractions.mockResolvedValue(null);
    mockedAttractionsService.getNearbyAttractions.mockResolvedValue(mockAttractions);
    mockedAttractionsService.cacheAttractions.mockResolvedValue(true);
  });

  describe('Initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useAttractions());

      expect(result.current.attractions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadAttractions', () => {
    it('should load attractions from cache when available', async () => {
      const cachedAttractions = mockAttractions.slice(0, 2);
      mockedAttractionsService.getCachedAttractions.mockResolvedValueOnce(cachedAttractions);

      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      expect(result.current.attractions).toEqual(cachedAttractions);
      expect(result.current.loading).toBe(false);
      expect(mockedAttractionsService.getNearbyAttractions).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache is empty', async () => {
      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedAttractionsService.getNearbyAttractions).toHaveBeenCalledWith(berlinCoordinates);
      expect(result.current.attractions).toEqual(mockAttractions);
    });

    it('should set loading state during fetch', async () => {
      const { result } = renderHook(() => useAttractions());

      act(() => {
        result.current.loadAttractions(berlinCoordinates);
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should cache attractions when no interests', async () => {
      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      await waitFor(() => {
        expect(mockedAttractionsService.cacheAttractions).toHaveBeenCalledWith(
          berlinCoordinates,
          mockAttractions,
          []
        );
      });
    });

    it('should classify attractions when user has interests', async () => {
      const interests = ['history', 'art'];
      mockedInterestsService.getInterests.mockResolvedValueOnce(interests);
      
      const classifiedAttractions = mockAttractions.map(a => ({
        ...a,
        interestScore: 8,
        interestReason: 'Matches interests',
      }));
      mockedOpenAIService.classifyAttractions.mockResolvedValueOnce(classifiedAttractions);
      mockedAttractionsService.sortByInterestScore.mockReturnValueOnce(classifiedAttractions);

      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      await waitFor(() => {
        expect(mockedOpenAIService.classifyAttractions).toHaveBeenCalledWith(
          mockAttractions,
          interests
        );
      });

      await waitFor(() => {
        expect(result.current.attractions).toEqual(classifiedAttractions);
      });
    });

    it('should handle classification errors gracefully', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      mockedInterestsService.getInterests.mockResolvedValueOnce(['history']);
      mockedOpenAIService.classifyAttractions.mockRejectedValueOnce(new Error('API error'));

      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      await waitFor(() => {
        expect(result.current.attractions).toEqual(mockAttractions);
      });

      expect(consoleLog).toHaveBeenCalledWith('Classification skipped:', expect.any(Error));
      consoleLog.mockRestore();
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      mockedAttractionsService.getNearbyAttractions.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear previous error on new load', async () => {
      mockedAttractionsService.getNearbyAttractions.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      expect(result.current.error).toBe('First error');

      mockedAttractionsService.getNearbyAttractions.mockResolvedValueOnce(mockAttractions);

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('classifyAttractions', () => {
    it('should classify current attractions', async () => {
      const { result } = renderHook(() => useAttractions());

      // Load attractions first
      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      const interests = ['history'];
      mockedInterestsService.getInterests.mockResolvedValueOnce(interests);
      
      const classifiedAttractions = mockAttractions.map(a => ({
        ...a,
        interestScore: 7,
      }));
      mockedOpenAIService.classifyAttractions.mockResolvedValueOnce(classifiedAttractions);
      mockedAttractionsService.sortByInterestScore.mockReturnValueOnce(classifiedAttractions);

      await act(async () => {
        await result.current.classifyAttractions();
      });

      await waitFor(() => {
        expect(result.current.attractions).toEqual(classifiedAttractions);
      });
    });

    it('should do nothing when no attractions loaded', async () => {
      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.classifyAttractions();
      });

      expect(mockedOpenAIService.classifyAttractions).not.toHaveBeenCalled();
    });

    it('should do nothing when no interests', async () => {
      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      mockedInterestsService.getInterests.mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.classifyAttractions();
      });

      expect(mockedOpenAIService.classifyAttractions).not.toHaveBeenCalled();
    });

    it('should handle classification errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      const { result } = renderHook(() => useAttractions());

      await act(async () => {
        await result.current.loadAttractions(berlinCoordinates);
      });

      mockedInterestsService.getInterests.mockResolvedValueOnce(['history']);
      mockedOpenAIService.classifyAttractions.mockRejectedValueOnce(new Error('API error'));

      await act(async () => {
        await result.current.classifyAttractions();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});
