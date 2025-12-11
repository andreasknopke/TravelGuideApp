/**
 * Smoke test to verify test infrastructure is working
 * Tests that all mocks and setup files are properly configured
 */

describe('Test Infrastructure Smoke Test', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });

  it('should have jest-native matchers available', () => {
    // Verify @testing-library/jest-native matchers are loaded
    const element = { props: { accessibilityLabel: 'test' } };
    // Just verify the matcher exists (won't actually run on non-React element)
    expect(typeof expect(element).toBeOnTheScreen).toBe('function');
  });

  it('should have AsyncStorage mocked', () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    expect(AsyncStorage.getItem).toBeDefined();
    expect(AsyncStorage.setItem).toBeDefined();
    expect(typeof AsyncStorage.getItem).toBe('function');
  });

  it('should have expo-location mocked', () => {
    const Location = require('expo-location');
    expect(Location.requestForegroundPermissionsAsync).toBeDefined();
    expect(Location.getCurrentPositionAsync).toBeDefined();
    expect(typeof Location.requestForegroundPermissionsAsync).toBe('function');
  });

  it('should have navigation mock factory available', () => {
    const { createMockNavigation } = require('./mocks');
    const mockNav = createMockNavigation();
    expect(mockNav.navigate).toBeDefined();
    expect(typeof mockNav.navigate).toBe('function');
  });

  it('should have route mock factory available', () => {
    const { createMockRoute } = require('./mocks');
    const mockRoute = createMockRoute('Test', { id: '1' });
    expect(mockRoute.name).toBe('Test');
    expect(mockRoute.params).toEqual({ id: '1' });
  });

  it('should have attraction fixtures available', () => {
    const { createMockAttraction, mockAttractions } = require('../fixtures/attractions');
    const attraction = createMockAttraction();
    expect(attraction).toHaveProperty('id');
    expect(attraction).toHaveProperty('name');
    expect(mockAttractions).toBeInstanceOf(Array);
    expect(mockAttractions.length).toBeGreaterThan(0);
  });

  it('should have location fixtures available', () => {
    const { berlinCoordinates, permissionGranted } = require('../fixtures/locations');
    expect(berlinCoordinates).toHaveProperty('latitude');
    expect(berlinCoordinates).toHaveProperty('longitude');
    expect(permissionGranted.status).toBe('granted');
  });

  it('should have API response fixtures available', () => {
    const { mockWikipediaResponse, mockOpenAIClassificationResponse } = require('../fixtures/apiResponses');
    expect(mockWikipediaResponse).toHaveProperty('query');
    expect(mockOpenAIClassificationResponse).toHaveProperty('choices');
  });
});
