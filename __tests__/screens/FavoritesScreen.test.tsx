/**
 * Tests for FavoritesScreen component
 * Coverage target: 75%
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FavoritesScreen from '../../src/screens/FavoritesScreen';
import { useFavorites } from '../../src/hooks';
import { createMockNavigation } from '../setup/mocks';
import { createMockAttraction, mockAttractions } from '../fixtures/attractions';

// Mock hooks and navigation
jest.mock('../../src/hooks');
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

const mockedUseFavorites = useFavorites as jest.MockedFunction<typeof useFavorites>;

describe('FavoritesScreen', () => {
  const mockNavigation = createMockNavigation();
  const { useNavigation } = require('@react-navigation/native');

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue(mockNavigation);
  });

  describe('Empty state', () => {
    it('should show empty message when no favorites', () => {
      mockedUseFavorites.mockReturnValue({
        favorites: [],
        favoriteIds: new Set(),
        loading: false,
        addFavorite: jest.fn(),
        removeFavorite: jest.fn(),
        toggleFavorite: jest.fn(),
        isFavorite: jest.fn(),
        refreshFavorites: jest.fn()
      });

      const { getByText } = render(<FavoritesScreen />);
      
      expect(getByText('noFavoritesSaved')).toBeTruthy();
    });
  });

  describe('Favorites list', () => {
    it('should render list of favorites', () => {
      const favorites = mockAttractions.slice(0, 3);
      mockedUseFavorites.mockReturnValue({
        favorites,
        favoriteIds: new Set(favorites.map(f => f.id)),
        loading: false,
        addFavorite: jest.fn(),
        removeFavorite: jest.fn(),
        toggleFavorite: jest.fn(),
        isFavorite: jest.fn(),
        refreshFavorites: jest.fn()
      });

      const { getByText, getAllByText } = render(<FavoritesScreen />);
      
      favorites.forEach(fav => {
        expect(getByText(fav.name)).toBeTruthy();
      });
      
      // Check that type appears (may be multiple times if duplicates)
      const types = getAllByText(favorites[0].type);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should show count of favorites', () => {
      const favorites = mockAttractions.slice(0, 2);
      mockedUseFavorites.mockReturnValue({
        favorites,
        favoriteIds: new Set(favorites.map(f => f.id)),
        loading: false,
        addFavorite: jest.fn(),
        removeFavorite: jest.fn(),
        toggleFavorite: jest.fn(),
        isFavorite: jest.fn(),
        refreshFavorites: jest.fn()
      });

      const { getByText } = render(<FavoritesScreen />);
      
      expect(getByText('2 Favoriten')).toBeTruthy();
    });

    it('should show singular count for one favorite', () => {
      const favorites = [mockAttractions[0]];
      mockedUseFavorites.mockReturnValue({
        favorites,
        favoriteIds: new Set(favorites.map(f => f.id)),
        loading: false,
        addFavorite: jest.fn(),
        removeFavorite: jest.fn(),
        toggleFavorite: jest.fn(),
        isFavorite: jest.fn(),
        refreshFavorites: jest.fn()
      });

      const { getByText } = render(<FavoritesScreen />);
      
      expect(getByText('1 Favorit')).toBeTruthy();
    });
  });

  describe('Favorite interactions', () => {
    it('should navigate to WebView when favorite is pressed', () => {
      const favorites = [mockAttractions[0]];
      mockedUseFavorites.mockReturnValue({
        favorites,
        favoriteIds: new Set(favorites.map(f => f.id)),
        loading: false,
        addFavorite: jest.fn(),
        removeFavorite: jest.fn(),
        toggleFavorite: jest.fn(),
        isFavorite: jest.fn(),
        refreshFavorites: jest.fn()
      });

      const { getByText } = render(<FavoritesScreen />);
      
      fireEvent.press(getByText(favorites[0].name));
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('WebView', { 
        name: favorites[0].name 
      });
    });

    it('should remove favorite when heart button is pressed', () => {
      const mockToggleFavorite = jest.fn();
      const favorites = [mockAttractions[0]];
      
      mockedUseFavorites.mockReturnValue({
        favorites,
        favoriteIds: new Set(favorites.map(f => f.id)),
        loading: false,
        addFavorite: jest.fn(),
        removeFavorite: jest.fn(),
        toggleFavorite: mockToggleFavorite,
        isFavorite: jest.fn(),
        refreshFavorites: jest.fn()
      });

      const { getAllByText } = render(<FavoritesScreen />);
      
      // Find heart emoji button
      const hearts = getAllByText('❤️');
      fireEvent.press(hearts[0]);
      
      expect(mockToggleFavorite).toHaveBeenCalledWith(favorites[0]);
    });

    it('should stop propagation when heart button is pressed', () => {
      const mockToggleFavorite = jest.fn();
      const favorites = [mockAttractions[0]];
      
      mockedUseFavorites.mockReturnValue({
        favorites,
        favoriteIds: new Set(favorites.map(f => f.id)),
        loading: false,
        addFavorite: jest.fn(),
        removeFavorite: jest.fn(),
        toggleFavorite: mockToggleFavorite,
        isFavorite: jest.fn(),
        refreshFavorites: jest.fn()
      });

      const { getAllByText } = render(<FavoritesScreen />);
      
      // Press heart button - should not navigate
      const hearts = getAllByText('❤️');
      fireEvent.press(hearts[0]);
      
      expect(mockToggleFavorite).toHaveBeenCalled();
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Rating display', () => {
    it('should show rating with star emoji', () => {
      const favorites = [createMockAttraction({ rating: 4.5 })];
      
      mockedUseFavorites.mockReturnValue({
        favorites,
        favoriteIds: new Set(favorites.map(f => f.id)),
        loading: false,
        addFavorite: jest.fn(),
        removeFavorite: jest.fn(),
        toggleFavorite: jest.fn(),
        isFavorite: jest.fn(),
        refreshFavorites: jest.fn()
      });

      const { getByText } = render(<FavoritesScreen />);
      
      expect(getByText('⭐ 4.5')).toBeTruthy();
    });
  });
});
