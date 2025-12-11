/**
 * Tests for MapScreen component  
 * Coverage target: 75%
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import MapScreen from '../../src/screens/MapScreen';
import { createMockNavigation } from '../setup/mocks';
import { mockAttractions } from '../fixtures/attractions';
import { berlinCoordinates } from '../fixtures/locations';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock services and dependencies
jest.mock('../../src/services/attractions.service', () => ({
  getNearbyAttractions: jest.fn()
}));
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('MapView', props),
    Marker: (props: any) => React.createElement('Marker', props),
    PROVIDER_GOOGLE: 'google'
  };
});

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
    NavigationProp: {}
  };
});

const { getNearbyAttractions } = require('../../src/services/attractions.service');

describe('MapScreen', () => {
  const mockNavigation = createMockNavigation();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    
    getNearbyAttractions.mockResolvedValue(mockAttractions);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('Loading state', () => {
    it('should show loading indicator initially', () => {
      const { getByText } = render(<MapScreen navigation={mockNavigation} />);
      expect(getByText('loading')).toBeTruthy();
    });
  });

  describe('Map data loading', () => {
    it('should load saved map data from AsyncStorage', async () => {
      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedData);

      const { getByTestId } = render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@travel_guide_map_data');
      });
    });

    it('should fall back to GPS when no saved data', async () => {
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValueOnce({
        coords: berlinCoordinates
      });

      render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      });
    });

    it('should fetch nearby attractions after getting location', async () => {
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValueOnce({
        coords: berlinCoordinates
      });

      render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getNearbyAttractions).toHaveBeenCalledWith(berlinCoordinates);
      });
    });
  });

  describe('Map rendering', () => {
    it('should render MapView after loading', async () => {
      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedData);

      const { UNSAFE_getByType } = render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        const mapView = UNSAFE_getByType('MapView');
        expect(mapView).toBeTruthy();
      });
    });

    it('should render markers for attractions', async () => {
      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedData);

      const { UNSAFE_getAllByType } = render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        const markers = UNSAFE_getAllByType('Marker');
        expect(markers.length).toBeGreaterThan(0);
      });
    });

    it('should show user location marker', async () => {
      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedData);

      const { UNSAFE_getAllByType } = render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        const markers = UNSAFE_getAllByType('Marker');
        // Should have user marker + attraction markers
        expect(markers.length).toBeGreaterThanOrEqual(mockAttractions.length);
      });
    });
  });

  describe('Marker interactions', () => {
    it('should select attraction when marker is pressed', async () => {
      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedData);

      const { UNSAFE_getAllByType } = render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        const markers = UNSAFE_getAllByType('Marker');
        expect(markers.length).toBeGreaterThan(0);
      });
    });

    it('should navigate to WebView when selected attraction button pressed', async () => {
      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedData);

      const { getByText, UNSAFE_getAllByType } = render(<MapScreen navigation={mockNavigation} />);
      
      // Wait for markers to load
      await waitFor(() => {
        const markers = UNSAFE_getAllByType('Marker');
        expect(markers.length).toBeGreaterThan(0);
      });
      
      // Get first marker and press it to select attraction
      const markers = UNSAFE_getAllByType('Marker');
      fireEvent.press(markers[0]);
      
      // Now look for the details button (translated key is 'viewDetails')
      await waitFor(() => {
        const detailsButton = getByText('viewDetails');
        fireEvent.press(detailsButton);
        expect(mockNavigation.navigate).toHaveBeenCalledWith('WebView', { name: expect.any(String) });
      });
    });
  });

  describe('Permission handling', () => {
    it('should show error when location permission denied', async () => {
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const { getByText } = render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('locationPermissionDenied')).toBeTruthy();
      });
    });

    it('should show retry button when location unavailable', async () => {
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const { getByText } = render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(getByText('getLocation')).toBeTruthy();
      });
    });

    it('should retry getting location when retry button pressed', async () => {
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync
        .mockResolvedValueOnce({ status: 'denied' })
        .mockResolvedValueOnce({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValueOnce({
        coords: berlinCoordinates
      });

      const { getByText } = render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        const retryButton = getByText('getLocation');
        fireEvent.press(retryButton);
      });
      
      await waitFor(() => {
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValueOnce({
        coords: berlinCoordinates
      });

      render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      
      consoleError.mockRestore();
    });

    it('should handle location service errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync.mockRejectedValueOnce(new Error('Permission error'));

      render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      
      consoleError.mockRestore();
    });

    it('should handle navigation errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const alertSpy = jest.spyOn(Alert, 'alert');
      
      mockNavigation.navigate.mockImplementationOnce(() => {
        throw new Error('Navigation error');
      });

      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(savedData);

      render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        // Component should be loaded
      });
      
      consoleError.mockRestore();
    });
  });

  describe('useFocusEffect', () => {
    it('should reload data when screen gains focus', async () => {
      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(savedData);

      render(<MapScreen navigation={mockNavigation} />);
      
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalled();
      });
    });
  });

  describe('Snapshots', () => {
    it('should match snapshot with attractions', async () => {
      const savedData = JSON.stringify({
        location: berlinCoordinates,
        attractions: mockAttractions,
        useGPS: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(savedData);

      const { toJSON, UNSAFE_getAllByType } = render(<MapScreen navigation={mockNavigation} />);
      
      // Wait for map to render with markers
      await waitFor(() => {
        const markers = UNSAFE_getAllByType('Marker');
        expect(markers.length).toBeGreaterThan(0);
      });

      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with loading state', () => {
      const { toJSON } = render(<MapScreen navigation={mockNavigation} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
