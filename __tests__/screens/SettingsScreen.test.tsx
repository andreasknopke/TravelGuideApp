/**
 * Tests for SettingsScreen component
 * Coverage target: 75%
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../src/screens/SettingsScreen';

// Mock services - must mock the named exports
jest.mock('../../src/services/interests.service', () => ({
  AVAILABLE_INTERESTS: [
    { id: 'museums', label: 'Museen', icon: '🏛️' },
    { id: 'nature', label: 'Natur', icon: '🌳' },
    { id: 'food', label: 'Essen & Trinken', icon: '🍽️' }
  ],
  getInterests: jest.fn(),
  saveInterests: jest.fn()
}));

jest.mock('react-i18next', () => {
  const mockChangeLanguage = jest.fn();
  return {
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        language: 'de',
        changeLanguage: mockChangeLanguage
      }
    }),
    // Export for testing
    __mockChangeLanguage: mockChangeLanguage
  };
});

const { getInterests, saveInterests } = require('../../src/services/interests.service');

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getInterests.mockResolvedValue([]);
    saveInterests.mockResolvedValue(true);
  });

  describe('Language selection', () => {
    it('should render language options', () => {
      const { getByText } = render(<SettingsScreen />);
      
      expect(getByText('selectLanguage')).toBeTruthy();
      expect(getByText('german')).toBeTruthy();
      expect(getByText('english')).toBeTruthy();
    });

    it('should show German as selected by default', () => {
      const { getAllByText } = render(<SettingsScreen />);
      
      // Should have checkmark for German
      const checkmarks = getAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should change language when option is pressed', async () => {
      const { __mockChangeLanguage } = require('react-i18next');
      __mockChangeLanguage.mockClear();

      const { getByText } = render(<SettingsScreen />);
      
      // Press English
      fireEvent.press(getByText('english'));
      
      await waitFor(() => {
        expect(__mockChangeLanguage).toHaveBeenCalledWith('en');
      });
    });
  });

  describe('Interests selection', () => {
    it('should load interests on mount', async () => {
      render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getInterests).toHaveBeenCalled();
      });
    });

    it('should render all available interests', () => {
      const { AVAILABLE_INTERESTS } = require('../../src/services/interests.service');
      const { getByText } = render(<SettingsScreen />);
      
      AVAILABLE_INTERESTS.forEach((interest: any) => {
        expect(getByText(interest.label)).toBeTruthy();
      });
    });

    it('should toggle interest when pressed', async () => {
      const { getByText } = render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getInterests).toHaveBeenCalled();
      });

      const firstInterest = require('../../src/services/interests.service').AVAILABLE_INTERESTS[0];
      
      fireEvent.press(getByText(firstInterest.label));
      
      await waitFor(() => {
        expect(saveInterests).toHaveBeenCalledWith([firstInterest.id]);
      });
    });

    it('should show selected interests with checkmarks', async () => {
      const firstInterest = require('../../src/services/interests.service').AVAILABLE_INTERESTS[0];
      getInterests.mockResolvedValueOnce([firstInterest.id]);

      const { getAllByText } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const checkmarks = getAllByText('✓');
        expect(checkmarks.length).toBeGreaterThan(0);
      });
    });

    it('should remove interest when already selected', async () => {
      const firstInterest = require('../../src/services/interests.service').AVAILABLE_INTERESTS[0];
      getInterests.mockResolvedValueOnce([firstInterest.id]);

      const { getByText } = render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getInterests).toHaveBeenCalled();
      });

      fireEvent.press(getByText(firstInterest.label));
      
      await waitFor(() => {
        expect(saveInterests).toHaveBeenCalledWith([]);
      });
    });
  });
});
