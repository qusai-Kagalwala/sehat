import { useColorScheme } from 'react-native';

/** Monochrome palette: greys only, so content and numbers carry the screen. */
export const themes = {
  light: {
    mode: 'light',
    background: '#FFFFFF',
    surface: '#F4F4F5',
    surfaceStrong: '#E4E4E7',
    border: '#D4D4D8',
    text: '#09090B',
    textMuted: '#52525B',
    accent: '#18181B',
    accentText: '#FAFAFA',
  },
  dark: {
    mode: 'dark',
    background: '#09090B',
    surface: '#18181B',
    surfaceStrong: '#27272A',
    border: '#3F3F46',
    text: '#FAFAFA',
    textMuted: '#A1A1AA',
    accent: '#FAFAFA',
    accentText: '#09090B',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 12, lg: 20 };
export const fontSize = { small: 13, body: 16, title: 22, display: 40 };

/** Follows the phone's light/dark setting. */
export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? themes.dark : themes.light;
}
