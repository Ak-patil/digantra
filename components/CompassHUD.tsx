import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistance, bearingToCardinal } from '@/lib/geo';

interface CompassHUDProps {
  distanceKm: number | null;
  bearing: number | null;
  heading: number | null;
  gpsAccuracy: number | null;
  needsCalibration: boolean;
  targetName: string;
}

export default function CompassHUD({
  distanceKm,
  bearing,
  heading,
  gpsAccuracy,
  needsCalibration,
  targetName,
}: CompassHUDProps) {
  return (
    <View style={styles.wrapper} pointerEvents="none">
      <View style={styles.topSection}>
        <Text style={styles.targetLabel}>{targetName}</Text>

        {distanceKm !== null ? (
          <Text style={styles.distanceValue}>{formatDistance(distanceKm)}</Text>
        ) : (
          <Text style={styles.distanceValue}>Locating…</Text>
        )}

        {bearing !== null && (
          <Text style={styles.bearingText}>
            {Math.round(bearing)}° {bearingToCardinal(bearing)}
          </Text>
        )}
      </View>

      <View style={styles.bottomSection}>
        {heading !== null && (
          <Text style={styles.metaText}>
            Heading: {Math.round(heading)}° {bearingToCardinal(heading)}
          </Text>
        )}

        {gpsAccuracy !== null && (
          <Text style={[styles.metaText, gpsAccuracy > 50 && styles.warningText]}>
            GPS accuracy: ±{Math.round(gpsAccuracy)} m
          </Text>
        )}

        {needsCalibration && (
          <View style={styles.calibrationBanner}>
            <Text style={styles.calibrationText}>
              ⟳ Move your phone in a figure-8 to calibrate the compass
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 26, 0.55)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  targetLabel: {
    color: '#8899bb',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  distanceValue: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bearingText: {
    color: '#ff8844',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 26, 0.55)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  metaText: {
    color: '#aabbcc',
    fontSize: 13,
    marginVertical: 2,
  },
  warningText: {
    color: '#ffaa33',
  },
  calibrationBanner: {
    marginTop: 8,
    backgroundColor: 'rgba(255,170,50,0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  calibrationText: {
    color: '#ffaa33',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
