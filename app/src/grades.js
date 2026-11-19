// Colour grades for the cover: each grade tints the photos and paints the caption band.
export const GRADE_PRESETS = {
  sunset: {
    label: 'Vice Sunset',
    skyTop: '#2b1055', skyMid: '#ff5e62', skyLow: '#ff9a3d',
    sun: '#ffd166', sunCore: '#fff3b0',
    wash: 'rgba(255, 94, 98, 0.20)', deep: 'rgba(120, 20, 90, 0.28)',
    accent: '#ff9a3d', ink: '#1c0b2e', band: '#160a24',
    filter: 'saturate(1.25) contrast(1.06)',
  },
  neon: {
    label: 'Neon Nights',
    skyTop: '#0d0221', skyMid: '#c724b1', skyLow: '#00e5ff',
    sun: '#ff2fb3', sunCore: '#ffe3f6',
    wash: 'rgba(199, 36, 177, 0.20)', deep: 'rgba(0, 40, 90, 0.30)',
    accent: '#00e5ff', ink: '#0d0221', band: '#0a0118',
    filter: 'saturate(1.35) contrast(1.08) hue-rotate(-8deg)',
  },
  noir: {
    label: 'Palm Noir',
    skyTop: '#04141a', skyMid: '#0f5f6b', skyLow: '#1fb6a6',
    sun: '#e8f6f3', sunCore: '#ffffff',
    wash: 'rgba(31, 182, 166, 0.16)', deep: 'rgba(2, 24, 28, 0.34)',
    accent: '#1fb6a6', ink: '#02181c', band: '#03100f',
    filter: 'saturate(0.85) contrast(1.10)',
  },
  golden: {
    label: 'Golden Hour',
    skyTop: '#3d1c02', skyMid: '#ff7b00', skyLow: '#ffd23f',
    sun: '#ffdf6b', sunCore: '#fff8d6',
    wash: 'rgba(255, 150, 30, 0.20)', deep: 'rgba(90, 30, 0, 0.26)',
    accent: '#ffd23f', ink: '#2b1200', band: '#1d0d00',
    filter: 'saturate(1.30) contrast(1.05) sepia(0.15)',
  },
};

/** Returns the preset for `key`, falling back to Vice Sunset. */
export function gradeFor(key) {
  return GRADE_PRESETS[key] ?? GRADE_PRESETS.sunset;
}

/** The grade names in menu order. */
export function gradeKeys() {
  return Object.keys(GRADE_PRESETS);
}
