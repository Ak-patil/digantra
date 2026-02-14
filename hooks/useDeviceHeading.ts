import { useEffect, useRef, useState } from 'react';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import { circularLowPass, lowPass } from '@/lib/filters';
import {
  MAGNETOMETER_INTERVAL_MS,
  ACCELEROMETER_INTERVAL_MS,
  HEADING_SMOOTHING_ALPHA,
  ACCEL_SMOOTHING_ALPHA,
  MAG_EXPECTED_MIN_UT,
  MAG_EXPECTED_MAX_UT,
} from '@/lib/constants';

export interface DeviceHeadingState {
  heading: number | null;
  needsCalibration: boolean;
  available: boolean;
}

interface SensorSnapshot {
  ax: number;
  ay: number;
  az: number;
  mx: number;
  my: number;
  mz: number;
}

export function useDeviceHeading(): DeviceHeadingState {
  const [heading, setHeading] = useState<number | null>(null);
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const [available, setAvailable] = useState(true);

  const raw = useRef<SensorSnapshot>({ ax: 0, ay: 0, az: -1, mx: 0, my: 0, mz: 0 });
  const smoothedHeading = useRef<number | null>(null);
  const smoothedAccel = useRef({ ax: 0, ay: 0, az: -1 });

  useEffect(() => {
    let magSub: ReturnType<typeof Magnetometer.addListener> | null = null;
    let accelSub: ReturnType<typeof Accelerometer.addListener> | null = null;
    let mounted = true;

    const bootstrap = async () => {
      const [magOk, accelOk] = await Promise.all([
        Magnetometer.isAvailableAsync().catch(() => false),
        Accelerometer.isAvailableAsync().catch(() => false),
      ]);

      if (!mounted) return;

      if (!magOk || !accelOk) {
        setAvailable(false);
        return;
      }

      Magnetometer.setUpdateInterval(MAGNETOMETER_INTERVAL_MS);
      Accelerometer.setUpdateInterval(ACCELEROMETER_INTERVAL_MS);

      accelSub = Accelerometer.addListener(({ x, y, z }) => {
        smoothedAccel.current.ax = lowPass(x, smoothedAccel.current.ax, ACCEL_SMOOTHING_ALPHA);
        smoothedAccel.current.ay = lowPass(y, smoothedAccel.current.ay, ACCEL_SMOOTHING_ALPHA);
        smoothedAccel.current.az = lowPass(z, smoothedAccel.current.az, ACCEL_SMOOTHING_ALPHA);

        raw.current.ax = smoothedAccel.current.ax;
        raw.current.ay = smoothedAccel.current.ay;
        raw.current.az = smoothedAccel.current.az;
      });

      magSub = Magnetometer.addListener(({ x, y, z }) => {
        raw.current.mx = x;
        raw.current.my = y;
        raw.current.mz = z;

        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const outOfRange = magnitude < MAG_EXPECTED_MIN_UT || magnitude > MAG_EXPECTED_MAX_UT;
        setNeedsCalibration(outOfRange);

        const { ax, ay, az } = raw.current;

        const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
        const roll = Math.atan2(ay, Math.sqrt(ax * ax + az * az));

        const Xh = x * Math.cos(pitch) + z * Math.sin(pitch);
        const Yh =
          x * Math.sin(roll) * Math.sin(pitch) +
          y * Math.cos(roll) -
          z * Math.sin(roll) * Math.cos(pitch);

        let rawHeading = (Math.atan2(Yh, Xh) * 180) / Math.PI;
        rawHeading = (rawHeading + 360) % 360;

        if (smoothedHeading.current === null) {
          smoothedHeading.current = rawHeading;
        } else {
          smoothedHeading.current = circularLowPass(
            rawHeading,
            smoothedHeading.current,
            HEADING_SMOOTHING_ALPHA,
          );
        }

        setHeading(smoothedHeading.current);
      });
    };

    bootstrap();

    return () => {
      mounted = false;
      magSub?.remove();
      accelSub?.remove();
    };
  }, []);

  return { heading, needsCalibration, available };
}
