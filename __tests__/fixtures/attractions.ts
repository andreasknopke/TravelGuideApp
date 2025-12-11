export interface Attraction {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  distance: number;
  rating: number;
  description?: string;
  wikiUrl?: string;
}

// Factory function with overrides
export function createMockAttraction(
  overrides?: Partial<Attraction>
): Attraction {
  return {
    id: '1',
    name: 'Brandenburg Gate',
    latitude: 52.5163,
    longitude: 13.3777,
    type: 'monument',
    description: 'Historic neoclassical monument',
    distance: 500,
    rating: 4.5,
    wikiUrl: 'https://en.wikipedia.org/wiki/Brandenburg_Gate',
    ...overrides
  };
}

// Predefined fixtures for common scenarios
export const mockAttractions: Attraction[] = [
  createMockAttraction({ id: '1', name: 'Brandenburg Gate' }),
  createMockAttraction({
    id: '2',
    name: 'Reichstag',
    latitude: 52.5186,
    longitude: 13.3762
  }),
  createMockAttraction({
    id: '3',
    name: 'Berlin Cathedral',
    latitude: 52.5191,
    longitude: 13.4012
  })
];

// Empty state fixture
export const emptyAttractions: Attraction[] = [];

// Edge case: Very far attraction
export const farAwayAttraction = createMockAttraction({
  id: 'far',
  name: 'Tokyo Tower',
  latitude: 35.6586,
  longitude: 139.7454,
  distance: 8918000 // ~8918 km from Berlin
});
