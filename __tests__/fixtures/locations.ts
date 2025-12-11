export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PermissionResponse {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  canAskAgain: boolean;
  expires: string;
}

// Common coordinate fixtures
export const berlinCoordinates: Coordinates = {
  latitude: 52.520008,
  longitude: 13.404954
};

export const tokyoCoordinates: Coordinates = {
  latitude: 35.6586,
  longitude: 139.7454
};

export const newYorkCoordinates: Coordinates = {
  latitude: 40.7128,
  longitude: -74.0060
};

// Edge case coordinates
export const northPole: Coordinates = {
  latitude: 90.0,
  longitude: 0.0
};

export const southPole: Coordinates = {
  latitude: -90.0,
  longitude: 0.0
};

export const dateline: Coordinates = {
  latitude: 0.0,
  longitude: 180.0
};

// Permission response fixtures
export const permissionGranted: PermissionResponse = {
  status: 'granted',
  granted: true,
  canAskAgain: false,
  expires: 'never'
};

export const permissionDenied: PermissionResponse = {
  status: 'denied',
  granted: false,
  canAskAgain: true,
  expires: 'never'
};

export const permissionUndetermined: PermissionResponse = {
  status: 'undetermined',
  granted: false,
  canAskAgain: true,
  expires: 'never'
};

// Location position mock
export function createMockPosition(coords: Coordinates) {
  return {
    coords: {
      ...coords,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0
    },
    timestamp: Date.now()
  };
}
