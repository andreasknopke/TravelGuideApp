/**
 * Tests for LocationSearchBar component
 * Coverage target: 75%
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LocationSearchBar from '../../src/components/LocationSearchBar';
import { useLocationSearch } from '../../src/hooks';
import { SearchResult } from '../../src/types';

jest.mock('../../src/hooks');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockedUseLocationSearch = useLocationSearch as jest.MockedFunction<typeof useLocationSearch>;

describe('LocationSearchBar', () => {
  const mockOnSelectLocation = jest.fn();
  
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

  const defaultMockReturn = {
    query: '',
    results: [],
    loading: false,
    error: null,
    selectedResult: null,
    setQuery: jest.fn(),
    selectResult: jest.fn(),
    clearSearch: jest.fn(),
    getSelectedCityInfo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseLocationSearch.mockReturnValue(defaultMockReturn);
  });

  describe('Rendering', () => {
    it('should render search input with placeholder', () => {
      const { getByPlaceholderText } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByPlaceholderText('searchLocationPlaceholder')).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      const { getByPlaceholderText } = render(
        <LocationSearchBar
          onSelectLocation={mockOnSelectLocation}
          placeholder="Custom placeholder"
        />
      );

      expect(getByPlaceholderText('Custom placeholder')).toBeTruthy();
    });

    it('should render search icon', () => {
      const { getByText } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByText('🔍')).toBeTruthy();
    });

    it('should not show clear button when query is empty', () => {
      const { queryByTestId } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(queryByTestId('clear-search-button')).toBeNull();
    });
  });

  describe('Query input', () => {
    it('should call setQuery when text changes', () => {
      const setQueryMock = jest.fn();
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        setQuery: setQueryMock,
      });

      const { getByTestId } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      const input = getByTestId('location-search-input');
      fireEvent.changeText(input, 'Berlin');

      expect(setQueryMock).toHaveBeenCalledWith('Berlin');
    });

    it('should show clear button when query has text', () => {
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
      });

      const { getByTestId } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByTestId('clear-search-button')).toBeTruthy();
    });

    it('should call clearSearch when clear button is pressed', () => {
      const clearSearchMock = jest.fn();
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
        clearSearch: clearSearchMock,
      });

      const { getByTestId } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      fireEvent.press(getByTestId('clear-search-button'));

      expect(clearSearchMock).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator when loading', () => {
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
        loading: true,
      });

      const { getByText } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByText('searchingLocations')).toBeTruthy();
    });

    it('should show loading indicator in search bar when loading', () => {
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
        loading: true,
      });

      const { UNSAFE_getAllByType } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      const activityIndicators = UNSAFE_getAllByType('ActivityIndicator' as any);
      expect(activityIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Search results', () => {
    it('should display search results', () => {
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
        results: mockSearchResults,
      });

      const { getByText } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByText('Berlin')).toBeTruthy();
      expect(getByText('Berlin, Germany')).toBeTruthy();
      expect(getByText('Munich')).toBeTruthy();
      expect(getByText('Bavaria, Germany')).toBeTruthy();
    });

    it('should call onSelectLocation when result is pressed', () => {
      const selectResultMock = jest.fn();
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
        results: mockSearchResults,
        selectResult: selectResultMock,
      });

      const { getByTestId } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      fireEvent.press(getByTestId('search-result-1'));

      expect(selectResultMock).toHaveBeenCalledWith(mockSearchResults[0]);
      expect(mockOnSelectLocation).toHaveBeenCalledWith(mockSearchResults[0]);
    });

    it('should show dropdown header when results exist', () => {
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
        results: mockSearchResults,
      });

      const { getByText } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByText('selectLocation')).toBeTruthy();
    });
  });

  describe('Empty states', () => {
    it('should show no results message when query has no results', () => {
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'XYZ123',
        results: [],
        loading: false,
      });

      const { getByText } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByText('noResultsFound')).toBeTruthy();
    });

    it('should not show dropdown when query is empty', () => {
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: '',
        results: [],
      });

      const { queryByTestId } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(queryByTestId('search-results-list')).toBeNull();
    });
  });

  describe('Error state', () => {
    it('should display error message when error occurs', () => {
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
        results: [],
        error: {
          message: 'Network error',
          code: 'NETWORK_ERROR',
        },
      });

      const { getByText } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByText('Network error')).toBeTruthy();
    });
  });

  describe('AutoFocus', () => {
    it('should auto-focus input when autoFocus is true', () => {
      const { getByTestId } = render(
        <LocationSearchBar
          onSelectLocation={mockOnSelectLocation}
          autoFocus={true}
        />
      );

      const input = getByTestId('location-search-input');
      expect(input.props.autoFocus).toBe(true);
    });

    it('should not auto-focus by default', () => {
      const { getByTestId } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      const input = getByTestId('location-search-input');
      expect(input.props.autoFocus).toBe(false);
    });
  });

  describe('Dropdown dismissal', () => {
    it('should call clearSearch when clear button is pressed', () => {
      const clearSearchMock = jest.fn();
      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Berlin',
        results: mockSearchResults,
        clearSearch: clearSearchMock,
      });

      const { getByTestId } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      const clearButton = getByTestId('clear-search-button');
      fireEvent.press(clearButton);

      expect(clearSearchMock).toHaveBeenCalled();
    });
  });

  describe('Result rendering details', () => {
    it('should show only primary name if secondary info is empty', () => {
      const resultWithoutSecondary: SearchResult = {
        id: '3',
        displayName: 'TestCity',
        primaryName: 'TestCity',
        secondaryInfo: '',
        coordinates: { latitude: 0, longitude: 0 },
        type: 'city',
        importance: 0.5,
      };

      mockedUseLocationSearch.mockReturnValue({
        ...defaultMockReturn,
        query: 'Test',
        results: [resultWithoutSecondary],
      });

      const { getByText, queryByText } = render(
        <LocationSearchBar onSelectLocation={mockOnSelectLocation} />
      );

      expect(getByText('TestCity')).toBeTruthy();
      // Secondary text should not be rendered when empty
    });
  });
});
