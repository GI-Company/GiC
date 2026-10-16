export type OpticalSettings = { exposure: number; laser: number; gain: number };
export function simulateOpticalFrame(settings: OpticalSettings, sequence: number) {
  const { exposure, laser, gain } = settings;
  if (![exposure, laser, gain].every(Number.isFinite) || exposure < 1 || exposure > 100 || laser < 0 || laser > 100 || gain < 1 || gain > 8 || !Number.isInteger(sequence) || sequence < 1 || sequence > 1000000) throw new Error('Optical simulation settings are outside supported bounds.');
  const width = 64, height = 48, pixels: number[] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    // Deterministic Gaussian spots, not a camera or an instrument acquisition.
    const spot = Math.exp(-((x - 23) ** 2 + (y - 22) ** 2) / 65) + 0.65 * Math.exp(-((x - 44) ** 2 + (y - 29) ** 2) / 25);
    pixels.push(Math.min(255, Math.round(4 + gain * exposure / 25 * laser / 100 * 220 * spot)));
  }
  return { format: 'gic-optical-sandbox-v1', epistemic_state: 'SIMULATED' as const, frame_id: sequence, settings: { ...settings }, width, height, pixels, statistics: { mean: pixels.reduce((a, b) => a + b, 0) / pixels.length, saturated: pixels.filter(v => v === 255).length, max: Math.max(...pixels) }, limitations: 'Synthetic Gaussian intensity field. No hardware command, FRAME_ACK, noise calibration, photon-count calibration, or physical measurement is represented.' };
}
export type OpticalFrame = ReturnType<typeof simulateOpticalFrame>;
