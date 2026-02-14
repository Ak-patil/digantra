export function lowPass(current: number, previous: number, alpha: number): number {
  return alpha * current + (1 - alpha) * previous;
}

export function circularLowPass(
  current: number,
  previous: number,
  alpha: number,
): number {
  let delta = current - previous;

  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  return ((previous + alpha * delta) % 360 + 360) % 360;
}
