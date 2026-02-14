import { useEffect, useRef, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { LOCATION_DISTANCE_FILTER_M } from '@/lib/constants';

export interface UserLocationState {
  location: { latitude: number; longitude: number } | null;
  accuracy: number | null;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<void>;
}

export function useUserLocation(): UserLocationState {
  const [location, setLocation] = useState<UserLocationState['location']>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<UserLocationState['permissionStatus']>('undetermined');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  const startWatching = useCallback(async () => {
    try {
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }

      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: LOCATION_DISTANCE_FILTER_M,
          timeInterval: 1_000,
        },
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setAccuracy(pos.coords.accuracy ?? null);
          setLoading(false);
          setError(null);
        },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to watch position';
      setError(msg);
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setPermissionStatus('granted');
        setError(null);
        startWatching();
      } else {
        setPermissionStatus('denied');
        setError('Location permission was denied.');
        setLoading(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Permission request failed';
      setError(msg);
      setLoading(false);
    }
  }, [startWatching]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();

        if (cancelled) return;

        if (status === 'granted') {
          setPermissionStatus('granted');
          startWatching();
        } else if (status === 'denied') {
          setPermissionStatus('denied');
          setLoading(false);
        } else {
          setPermissionStatus('undetermined');
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Location init failed';
        setError(msg);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, [startWatching]);

  return {
    location,
    accuracy,
    permissionStatus,
    error,
    loading,
    requestPermission,
  };
}
