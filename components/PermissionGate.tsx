import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';

interface PermissionGateProps {
  status: 'undetermined' | 'granted' | 'denied';
  onRequest: () => void;
  children: React.ReactNode;
}

export default function PermissionGate({ status, onRequest, children }: PermissionGateProps) {
  if (status === 'granted') {
    return <>{children}</>;
  }

  const isDenied = status === 'denied';

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>📍</Text>
      </View>

      <Text style={styles.title}>
        {isDenied ? 'Location Access Denied' : 'Location Required'}
      </Text>

      <Text style={styles.body}>
        {isDenied
          ? 'This app needs location access to compute the distance and direction to Digantara Industries. Please enable it in your device settings.'
          : 'To show you the direction and distance to Digantara Industries, we need access to your location.'}
      </Text>

      {isDenied ? (
        <TouchableOpacity
          style={[styles.button, styles.settingsButton]}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={onRequest}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Allow Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,85,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    color: '#8899bb',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#ff5500',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  settingsButton: {
    backgroundColor: '#334466',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
