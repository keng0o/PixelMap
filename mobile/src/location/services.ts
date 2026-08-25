import * as Location from 'expo-location';

import type { LocationAdapter } from './currentLocation';

export const locationAdapter: LocationAdapter = {
  async getCurrentPosition() {
    const result = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      accuracy: result.coords.accuracy,
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
    };
  },
  hasServicesEnabled: Location.hasServicesEnabledAsync,
  requestForegroundPermission: Location.requestForegroundPermissionsAsync,
};
