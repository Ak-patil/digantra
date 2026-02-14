import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useUserLocation } from '@/hooks/useUserLocation';
import { useDeviceHeading } from '@/hooks/useDeviceHeading';
import { haversineDistance, computeBearing } from '@/lib/geo';
import { TARGET } from '@/lib/constants';

import ArrowScene from '@/components/ArrowScene';
import CompassHUD from '@/components/CompassHUD';
import PermissionGate from '@/components/PermissionGate';

export default function CompassScreen() {
  const {
    location,
    accuracy: gpsAccuracy,
    permissionStatus,
    loading: locationLoading,
    requestPermission,
  } = useUserLocation();

  const {
    heading,
    needsCalibration,
    available: sensorsAvailable,
  } = useDeviceHeading();

  const bearing = useMemo(() => {
    if (!location) return null;
    return computeBearing(
      location.latitude,
      location.longitude,
      TARGET.latitude,
      TARGET.longitude,
    );
  }, [location]);

  const distanceKm = useMemo(() => {
    if (!location) return null;
    return haversineDistance(
      location.latitude,
      location.longitude,
      TARGET.latitude,
      TARGET.longitude,
    );
  }, [location]);

  const relativeAngle = useMemo(() => {
    if (bearing === null || heading === null) return 0;
    return (bearing - heading + 360) % 360;
  }, [bearing, heading]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <PermissionGate status={permissionStatus} onRequest={requestPermission}>
        {!sensorsAvailable && (
          <View style={styles.sensorWarning}>
            <Text style={styles.sensorWarningText}>
              Compass sensors are not available on this device.{'\n'}
              The arrow will not respond to rotation.
            </Text>
          </View>
        )}

        {locationLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ff5500" />
            <Text style={styles.loadingText}>Acquiring GPS fix…</Text>
          </View>
        )}

        <View style={styles.sceneContainer}>
          <ArrowScene rotationDeg={relativeAngle} />
        </View>

        <CompassHUD
          distanceKm={distanceKm}
          bearing={bearing}
          heading={heading}
          gpsAccuracy={gpsAccuracy}
          needsCalibration={needsCalibration}
          targetName={TARGET.name}
        />
      </PermissionGate>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  sceneContainer: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,26,0.8)',
  },
  loadingText: {
    color: '#8899bb',
    fontSize: 15,
    marginTop: 16,
  },
  sensorWarning: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 20,
    backgroundColor: 'rgba(255,170,50,0.15)',
    borderRadius: 12,
    padding: 14,
  },
  sensorWarningText: {
    color: '#ffaa33',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
