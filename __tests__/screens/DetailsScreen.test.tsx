/**
 * Tests for DetailsScreen component
 * Coverage target: 75%
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DetailsScreen from '../../src/screens/DetailsScreen';
import { createMockRoute } from '../setup/mocks';

// Mock services - must mock individual service files with named exports
jest.mock('../../src/services/wiki.service', () => ({
  fetchWikitravelData: jest.fn()
}));
jest.mock('../../src/services/openai.service', () => ({
  fetchLLMDescription: jest.fn()
}));
jest.mock('../../src/services/interests.service', () => ({
  getInterestLabels: jest.fn(),
  AVAILABLE_INTERESTS: []
}));
jest.mock('../../src/services/storage.service', () => ({
  getCachedAIDescription: jest.fn(),
  cacheAIDescription: jest.fn()
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'de' }
  })
}));

const { fetchWikitravelData } = require('../../src/services/wiki.service');
const { fetchLLMDescription } = require('../../src/services/openai.service');
const { getInterestLabels } = require('../../src/services/interests.service');
const { getCachedAIDescription, cacheAIDescription } = require('../../src/services/storage.service');

describe('DetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    getInterestLabels.mockResolvedValue([]);
    getCachedAIDescription.mockResolvedValue(null);
    cacheAIDescription.mockResolvedValue(true);
    fetchWikitravelData.mockResolvedValue({
      extract: 'Berlin is the capital of Germany.',
      coordinates: { lat: 52.52, lon: 13.40 }
    });
    fetchLLMDescription.mockResolvedValue('AI description of Berlin.');
  });

  describe('Loading state', () => {
    it('should show loading indicator initially', () => {
      const route = createMockRoute('Details', { 
        location: 'Berlin',
        coordinates: { latitude: 52.52, longitude: 13.40 }
      });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      expect(getByText('loading')).toBeTruthy();
    });
  });

  describe('Location display', () => {
    it('should display location name', async () => {
      const route = createMockRoute('Details', { 
        location: 'Brandenburg Gate',
        coordinates: { latitude: 52.52, longitude: 13.40 }
      });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(getByText('Brandenburg Gate')).toBeTruthy();
      });
    });

    it('should display coordinates', async () => {
      const route = createMockRoute('Details', { 
        location: 'Berlin',
        coordinates: { latitude: 52.5200, longitude: 13.4050 }
      });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(getByText(/52.5200/)).toBeTruthy();
        expect(getByText(/13.4050/)).toBeTruthy();
      });
    });
  });

  describe('Tab navigation', () => {
    it('should render Wikipedia and AI tabs', async () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(getByText('Wikipedia')).toBeTruthy();
        expect(getByText('Für dich interessant')).toBeTruthy();
      });
    });

    it('should switch to AI tab when pressed', async () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(getByText('Wikipedia')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Für dich interessant'));
      
      await waitFor(() => {
        expect(getByText(/AI description/)).toBeTruthy();
      });
    });

    it('should show Wikipedia tab content by default', async () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(getByText(/capital of Germany/)).toBeTruthy();
      });
    });
  });

  describe('Wiki data loading', () => {
    it('should load and display wiki data', async () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(fetchWikitravelData).toHaveBeenCalledWith('Berlin', 'de');
        expect(getByText(/capital of Germany/)).toBeTruthy();
      });
    });

    it('should show no data message when wiki data unavailable', async () => {
      fetchWikitravelData.mockResolvedValueOnce({ extract: null });
      
      const route = createMockRoute('Details', { location: 'Unknown' });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      // Auto-switches to AI tab when extract is null, so click Wikipedia tab
      await waitFor(() => {
        const wikiTab = getByText('Wikipedia');
        fireEvent.press(wikiTab);
      });
      
      await waitFor(() => {
        expect(getByText('noInformationAvailable')).toBeTruthy();
      });
    });

    it('should auto-switch to AI tab when wiki data is empty', async () => {
      fetchWikitravelData.mockResolvedValueOnce({
        extract: 'no detailed information'
      });
      
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        // Should show AI description
        expect(getByText(/AI description/)).toBeTruthy();
      });
    });
  });

  describe('AI description loading', () => {
    it('should load AI description with user interests', async () => {
      getInterestLabels.mockResolvedValueOnce(['history', 'art']);
      
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(fetchLLMDescription).toHaveBeenCalledWith(
          'Berlin',
          expect.stringContaining('history')
        );
      });
    });

    it('should use cached AI description when available', async () => {
      getCachedAIDescription.mockResolvedValueOnce('Cached description');
      
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(fetchLLMDescription).not.toHaveBeenCalled();
      });
    });

    it('should cache new AI description', async () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(cacheAIDescription).toHaveBeenCalledWith(
          'Berlin',
          [],
          'AI description of Berlin.'
        );
      });
    });

    it('should display AI description in AI tab', async () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      const { getByText } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        fireEvent.press(getByText('Für dich interessant'));
      });
      
      await waitFor(() => {
        expect(getByText(/AI description/)).toBeTruthy();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle wiki service errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      fetchWikitravelData.mockRejectedValueOnce(new Error('API error'));
      
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      
      consoleError.mockRestore();
    });

    it('should handle AI service errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      fetchLLMDescription.mockRejectedValueOnce(new Error('AI error'));
      
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      
      consoleError.mockRestore();
    });
  });

  describe('Data reload on location change', () => {
    it('should reload data when location changes', async () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      
      const { rerender } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(fetchWikitravelData).toHaveBeenCalledTimes(1);
      });
      
      const newRoute = createMockRoute('Details', { location: 'Munich' });
      rerender(<DetailsScreen route={newRoute} />);
      
      await waitFor(() => {
        expect(fetchWikitravelData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Snapshots', () => {
    it('should match snapshot with loaded data', async () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      const { toJSON } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(fetchWikitravelData).toHaveBeenCalled();
      });

      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with loading state', () => {
      const route = createMockRoute('Details', { location: 'Berlin' });
      const { toJSON } = render(<DetailsScreen route={route} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with cached AI description', async () => {
      getCachedAIDescription.mockResolvedValueOnce('Cached AI description');
      
      const route = createMockRoute('Details', { location: 'Berlin' });
      const { toJSON } = render(<DetailsScreen route={route} />);
      
      await waitFor(() => {
        expect(getCachedAIDescription).toHaveBeenCalled();
      });

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
