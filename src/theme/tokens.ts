 // Nexora design tokens — single source of truth
export const colors = {
  bg:       '#060608',
  bg2:      '#0c0c10',
  bg3:      '#111118',
  surface:  '#16161f',
  surface2: '#1e1e2a',
  border:   'rgba(255,255,255,0.06)',
  border2:  'rgba(255,255,255,0.10)',

  gold:     '#c9a84c',
  gold2:    '#e8c97a',
  purple:   '#9b5fe0',
  purple2:  '#b57ff5',
  teal:     '#4cc9c0',
  red:      '#e05a5a',
  green:    '#5ac97a',
  orange:   '#e08a3c',

  text:     '#e8e8f0',
  text2:    '#9090a8',
  text3:    '#5a5a72',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radii = {
  none: 0, sm: 4, md: 8, lg: 16, full: 999,
} as const;

export const statusColors: Record<string, string> = {
  submitted:   '#5a8de0',
  verified:    colors.teal,
  assigned:    colors.gold,
  in_progress: colors.orange,
  resolved:    colors.green,
  closed:      colors.text3,
};
