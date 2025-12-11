/**
 * Tests for distance utility functions
 * Coverage target: 90%
 * 
 * Tests validate Haversine formula implementation and edge cases
 */

import { calculateDistance, hasSignificantMovement } from '../../src/utils/distance';
import { Coordinates } from '../../src/types';

describe('calculateDistance', () => {
  describe('Normal coordinates', () => {
    it('should calculate distance between Berlin and Munich', () => {
      const berlin: Coordinates = { latitude: 52.52, longitude: 13.405 };
      const munich: Coordinates = { latitude: 48.1351, longitude: 11.582 };
      
      const distance = calculateDistance(berlin, munich);
      
      // Expected distance: ~504 km = ~504,000 meters
      expect(distance).toBeGreaterThan(500000);
      expect(distance).toBeLessThan(510000);
    });

    it('should calculate distance between nearby points', () => {
      const point1: Coordinates = { latitude: 52.5163, longitude: 13.3777 };
      const point2: Coordinates = { latitude: 52.5186, longitude: 13.3762 };
      
      const distance = calculateDistance(point1, point2);
      
      // Should be around 270 meters
      expect(distance).toBeGreaterThan(250);
      expect(distance).toBeLessThan(300);
    });

    it('should calculate zero distance for same coordinates', () => {
      const point: Coordinates = { latitude: 52.52, longitude: 13.405 };
      
      const distance = calculateDistance(point, point);
      
      expect(distance).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle coordinates at North Pole', () => {
      const northPole1: Coordinates = { latitude: 90, longitude: 0 };
      const northPole2: Coordinates = { latitude: 90, longitude: 180 };
      
      const distance = calculateDistance(northPole1, northPole2);
      
      // At the pole, all longitudes converge, so distance should be 0
      expect(distance).toBeLessThan(1);
    });

    it('should handle coordinates at South Pole', () => {
      const southPole1: Coordinates = { latitude: -90, longitude: 0 };
      const southPole2: Coordinates = { latitude: -90, longitude: 180 };
      
      const distance = calculateDistance(southPole1, southPole2);
      
      // At the pole, all longitudes converge, so distance should be 0
      expect(distance).toBeLessThan(1);
    });

    it('should handle coordinates crossing the International Date Line', () => {
      // Point just west of date line
      const point1: Coordinates = { latitude: 0, longitude: 179.5 };
      // Point just east of date line
      const point2: Coordinates = { latitude: 0, longitude: -179.5 };
      
      const distance = calculateDistance(point1, point2);
      
      // Should calculate shortest path (1 degree ≈ 111 km at equator)
      expect(distance).toBeGreaterThan(100000);
      expect(distance).toBeLessThan(120000);
    });

    it('should handle coordinates at the equator', () => {
      const point1: Coordinates = { latitude: 0, longitude: 0 };
      const point2: Coordinates = { latitude: 0, longitude: 1 };
      
      const distance = calculateDistance(point1, point2);
      
      // At equator, 1 degree longitude ≈ 111 km
      expect(distance).toBeGreaterThan(110000);
      expect(distance).toBeLessThan(112000);
    });

    it('should handle very large distances (antipodal points)', () => {
      const point1: Coordinates = { latitude: 0, longitude: 0 };
      const point2: Coordinates = { latitude: 0, longitude: 180 };
      
      const distance = calculateDistance(point1, point2);
      
      // Half of Earth's circumference at equator ≈ 20,000 km
      expect(distance).toBeGreaterThan(19900000);
      expect(distance).toBeLessThan(20100000);
    });

    it('should handle negative coordinates (Southern/Western hemispheres)', () => {
      const sydney: Coordinates = { latitude: -33.8688, longitude: 151.2093 };
      const johannesburg: Coordinates = { latitude: -26.2041, longitude: 28.0473 };
      
      const distance = calculateDistance(sydney, johannesburg);
      
      // Expected distance: ~11,000 km
      expect(distance).toBeGreaterThan(10900000);
      expect(distance).toBeLessThan(11100000);
    });

    it('should be symmetric (distance A to B equals B to A)', () => {
      const point1: Coordinates = { latitude: 52.52, longitude: 13.405 };
      const point2: Coordinates = { latitude: 48.1351, longitude: 11.582 };
      
      const distance1 = calculateDistance(point1, point2);
      const distance2 = calculateDistance(point2, point1);
      
      expect(distance1).toBe(distance2);
    });

    it('should handle very small differences (precision)', () => {
      const point1: Coordinates = { latitude: 52.520000, longitude: 13.405000 };
      const point2: Coordinates = { latitude: 52.520001, longitude: 13.405001 };
      
      const distance = calculateDistance(point1, point2);
      
      // Should be approximately 0.15 meters
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1);
    });

    it('should handle coordinates with maximum precision', () => {
      const point1: Coordinates = { 
        latitude: 52.520008, 
        longitude: 13.404954 
      };
      const point2: Coordinates = { 
        latitude: 52.520009, 
        longitude: 13.404955 
      };
      
      const distance = calculateDistance(point1, point2);
      
      // Should be less than 1 meter
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThan(1);
    });
  });

  describe('Haversine formula accuracy', () => {
    it('should match known distance: New York to London', () => {
      const newYork: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const london: Coordinates = { latitude: 51.5074, longitude: -0.1278 };
      
      const distance = calculateDistance(newYork, london);
      
      // Known distance: ~5,570 km
      expect(distance).toBeGreaterThan(5550000);
      expect(distance).toBeLessThan(5590000);
    });

    it('should match known distance: Tokyo to Los Angeles', () => {
      const tokyo: Coordinates = { latitude: 35.6762, longitude: 139.6503 };
      const losAngeles: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
      
      const distance = calculateDistance(tokyo, losAngeles);
      
      // Known distance: ~8,800 km
      expect(distance).toBeGreaterThan(8750000);
      expect(distance).toBeLessThan(8850000);
    });
  });
});

describe('hasSignificantMovement', () => {
  describe('With default threshold (0.005)', () => {
    it('should return true if oldCoord is null', () => {
      const newCoord: Coordinates = { latitude: 52.52, longitude: 13.405 };
      
      const result = hasSignificantMovement(null, newCoord);
      
      expect(result).toBe(true);
    });

    it('should return true for significant latitude change', () => {
      const oldCoord: Coordinates = { latitude: 52.52, longitude: 13.405 };
      const newCoord: Coordinates = { latitude: 52.53, longitude: 13.405 };
      
      const result = hasSignificantMovement(oldCoord, newCoord);
      
      expect(result).toBe(true);
    });

    it('should return true for significant longitude change', () => {
      const oldCoord: Coordinates = { latitude: 52.52, longitude: 13.405 };
      const newCoord: Coordinates = { latitude: 52.52, longitude: 13.415 };
      
      const result = hasSignificantMovement(oldCoord, newCoord);
      
      expect(result).toBe(true);
    });

    it('should return true for significant change in both coordinates', () => {
      const oldCoord: Coordinates = { latitude: 52.52, longitude: 13.405 };
      const newCoord: Coordinates = { latitude: 52.53, longitude: 13.415 };
      
      const result = hasSignificantMovement(oldCoord, newCoord);
      
      expect(result).toBe(true);
    });

    it('should return false for insignificant change', () => {
      const oldCoord: Coordinates = { latitude: 52.52, longitude: 13.405 };
      const newCoord: Coordinates = { latitude: 52.521, longitude: 13.406 };
      
      const result = hasSignificantMovement(oldCoord, newCoord);
      
      expect(result).toBe(false);
    });

    it('should return false for no change', () => {
      const coord: Coordinates = { latitude: 52.52, longitude: 13.405 };
      
      const result = hasSignificantMovement(coord, coord);
      
      expect(result).toBe(false);
    });
  });

  describe('With custom threshold', () => {
    it('should use custom threshold for detection', () => {
      const oldCoord: Coordinates = { latitude: 52.52, longitude: 13.405 };
      const newCoord: Coordinates = { latitude: 52.522, longitude: 13.405 };
      
      // With threshold 0.001, this should be significant (0.002 > 0.001)
      const result1 = hasSignificantMovement(oldCoord, newCoord, 0.001);
      expect(result1).toBe(true);
      
      // With threshold 0.01, this should be insignificant (0.002 < 0.01)
      const result2 = hasSignificantMovement(oldCoord, newCoord, 0.01);
      expect(result2).toBe(false);
    });

    it('should handle very small threshold', () => {
      const oldCoord: Coordinates = { latitude: 52.520000, longitude: 13.405000 };
      const newCoord: Coordinates = { latitude: 52.520001, longitude: 13.405001 };
      
      const result = hasSignificantMovement(oldCoord, newCoord, 0.000001);
      
      expect(result).toBe(true);
    });

    it('should handle very large threshold', () => {
      const oldCoord: Coordinates = { latitude: 52.52, longitude: 13.405 };
      const newCoord: Coordinates = { latitude: 53.52, longitude: 14.405 };
      
      const result = hasSignificantMovement(oldCoord, newCoord, 10);
      
      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle negative coordinates', () => {
      const oldCoord: Coordinates = { latitude: -33.8688, longitude: 151.2093 };
      const newCoord: Coordinates = { latitude: -33.8750, longitude: 151.2150 };
      
      const result = hasSignificantMovement(oldCoord, newCoord);
      
      expect(result).toBe(true);
    });

    it('should handle coordinates near poles', () => {
      const oldCoord: Coordinates = { latitude: 89.99, longitude: 0 };
      const newCoord: Coordinates = { latitude: 89.995, longitude: 180 };
      
      const result = hasSignificantMovement(oldCoord, newCoord);
      
      expect(result).toBe(true);
    });

    it('should handle coordinates crossing date line', () => {
      const oldCoord: Coordinates = { latitude: 0, longitude: 179.999 };
      const newCoord: Coordinates = { latitude: 0, longitude: -179.999 };
      
      // This is a very small actual distance but large numeric difference
      // Function checks coordinate difference, not actual distance
      const result = hasSignificantMovement(oldCoord, newCoord);
      
      expect(result).toBe(true);
    });
  });
});
