export const TARGET = {
  name: 'Digantara Industries',
  latitude: 13.0453132,
  longitude: 77.5733936,
} as const;

export const EARTH_RADIUS_KM = 6_371.0088;

export const MAGNETOMETER_INTERVAL_MS = 100;

export const ACCELEROMETER_INTERVAL_MS = 100;

export const HEADING_SMOOTHING_ALPHA = 0.12;

export const ACCEL_SMOOTHING_ALPHA = 0.25;

export const MAG_EXPECTED_MIN_UT = 20;
export const MAG_EXPECTED_MAX_UT = 70;

export const LOCATION_DISTANCE_FILTER_M = 5;
