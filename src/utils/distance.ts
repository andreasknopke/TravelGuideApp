import { Coordinates } from '../types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if coordinate has moved significantly
 */
export const hasSignificantMovement = (
  oldCoord: Coordinates | null,
  newCoord: Coordinates,
  threshold: number = 0.005
): boolean => {
  if (!oldCoord) return true;
  
  return (
    Math.abs(newCoord.latitude - oldCoord.latitude) > threshold ||
    Math.abs(newCoord.longitude - oldCoord.longitude) > threshold
  );
};
