# Digantara Compass

A React Native (Expo) application that uses device sensors and geolocation to point a 3D arrow toward **Digantara Industries** in Bengaluru, India — while displaying real-time distance to the landmark.

Built with TypeScript, Expo managed workflow, `expo-sensors`, `expo-location`, and `expo-three`.

---

## Quick Start

```bash
# Install dependencies
yarn install

# Run on a physical device (sensors require real hardware)
npx expo start --dev-client
# or
npx expo run:ios
npx expo run:android
```

> **Note:** The magnetometer and accelerometer are only available on physical devices. The app will show a warning if sensors are missing (e.g., on a simulator).

---

## Architecture

```
lib/
  constants.ts        # Target coordinates, filter tuning, intervals
  geo.ts              # Haversine distance & forward bearing (pure math)
  filters.ts          # Low-pass filter, circular angle smoothing

hooks/
  useUserLocation.ts  # expo-location wrapper — permission + watch
  useDeviceHeading.ts # Magnetometer + accelerometer sensor fusion

components/
  ArrowScene.tsx      # expo-three GLView — 3D arrow visualisation
  CompassHUD.tsx      # Distance / bearing / accuracy overlay
  PermissionGate.tsx  # Permission prompt & denial fallback

app/
  _layout.tsx         # Root layout (SafeArea, StatusBar, Slot)
  index.tsx           # Main screen — orchestrates hooks + components
```

### Design principles

1. **Separation of concerns** — all geographic math lives in `lib/geo.ts` as pure functions with zero dependencies. The sensor fusion lives in `hooks/useDeviceHeading.ts`. The 3D arrow in `components/ArrowScene.tsx` is a dumb consumer that takes a rotation angle. You can replace any layer without touching the others.

2. **Pure math, testable math** — `haversineDistance`, `computeBearing`, `lowPass`, and `circularLowPass` are all stateless functions that take numbers and return numbers. They can be unit-tested without React, mocks, or a device.

3. **Thin render loop** — the Three.js scene only updates the arrow's Y-rotation on each frame. No physics, no complex shaders, minimal GPU work.

---

## Sensor Handling

### Device heading (compass)

The heading is computed by fusing data from two sensors:

| Sensor | Purpose |
|--------|---------|
| **Accelerometer** | Provides the gravity vector `(ax, ay, az)`, used to derive device pitch and roll. |
| **Magnetometer** | Provides the magnetic field vector `(mx, my, mz)`, which encodes the heading relative to magnetic north. |

#### Tilt compensation

A naïve `atan2(my, mx)` only works when the phone is perfectly flat. In practice, users tilt their phone in every direction. We apply standard tilt compensation:

1. Compute **pitch** and **roll** from the accelerometer gravity vector.
2. Project the magnetometer vector onto the horizontal plane:
   ```
   Xh = mx·cos(pitch) + mz·sin(pitch)
   Yh = mx·sin(roll)·sin(pitch) + my·cos(roll) - mz·sin(roll)·cos(pitch)
   ```
3. `heading = atan2(Yh, Xh)`, converted to degrees and normalised to `[0, 360)`.

#### Smoothing

Raw magnetometer data is noisy. We apply a **circular low-pass (exponential moving average)** that correctly handles the 0°/360° wraparound:

```
delta = newAngle - prevAngle
if delta > 180  → delta -= 360
if delta < -180 → delta += 360
smoothed = (prev + alpha * delta) mod 360
```

The smoothing factor (`alpha = 0.12`) trades off between responsiveness and jitter reduction. The accelerometer axes are independently smoothed with `alpha = 0.25` before they're used for tilt compensation.

#### Calibration detection

If the magnitude of the magnetic field vector falls outside the expected 20–70 µT range, the UI shows a banner prompting the user to perform a figure-8 calibration gesture.

---

## Bearing & Distance Calculations

### Haversine distance

Classic great-circle distance on a sphere:

```
a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)
c = 2·atan2(√a, √(1−a))
distance = R · c            (R = 6371.0088 km)
```

### Forward bearing (initial azimuth)

```
y = sin(Δlon) · cos(lat2)
x = cos(lat1)·sin(lat2) − sin(lat1)·cos(lat2)·cos(Δlon)
bearing = atan2(y, x)       → normalised to [0, 360)
```

### Relative arrow angle

The 3D arrow needs to rotate by the difference between where the target is (bearing) and where the phone is facing (heading):

```
relativeAngle = (bearing − heading + 360) mod 360
```

---

## Target Landmark

| | |
|-|-|
| **Name** | Digantara Industries |
| **City** | Bengaluru, India |
| **Latitude** | 13.0453132 |
| **Longitude** | 77.5733936 |

These coordinates are hardcoded in `lib/constants.ts`.

---

## Edge Cases & Error Handling

| Scenario | Behaviour |
|----------|-----------|
| **Permission not granted** | A full-screen prompt explains why location is needed and offers a button to request it. |
| **Permission denied** | The prompt changes to show an "Open Settings" button that deep-links to the app's settings page. |
| **Indoor / weak GPS** | The last known position is used; if accuracy exceeds 50 m the HUD highlights it in amber. |
| **Magnetometer uncalibrated** | A banner appears: "Move your phone in a figure-8 to calibrate the compass". |
| **Heading near 0°/360°** | The circular low-pass filter prevents the value from jumping between 1° and 359°. |
| **Sensors unavailable (emulator)** | A warning banner is shown; the arrow remains static. |
| **App backgrounded** | Sensor and location subscriptions are cleaned up via `useEffect` return functions and re-established on mount. |

---

## Known Limitations & Assumptions

1. **Magnetic north, not true north** — the heading is relative to magnetic north. We do not correct for magnetic declination (the difference is typically 1–3° in most locations and is negligible for this use case).

2. **Spherical Earth model** — the Haversine formula assumes a perfect sphere. For the distances involved (hundreds or thousands of km) the error vs. WGS-84 ellipsoid is well under 0.5%.

3. **No background location** — we only use foreground location permissions. The compass stops updating when the app is in the background.

4. **Sensor noise varies by device** — the smoothing constants (`alpha` values) are tuned for mid-range smartphones. High-end devices with better IMUs may benefit from a higher alpha for snappier response; cheap devices may need a lower one.

5. **No ARKit / ARCore / Google Maps** — intentionally. This is a math + sensors solution.

---

## Tech Stack

- **React Native** (Expo SDK 54, managed workflow)
- **TypeScript** (strict mode)
- **expo-location** — foreground geolocation
- **expo-sensors** — magnetometer, accelerometer
- **expo-gl** + **expo-three** + **three** — lightweight 3D arrow
- **Expo Router** — file-based routing

---

## License

MIT
