import { mauve, mauveDark, iris, irisDark, sand, sandDark, orange, orangeDark } from '@radix-ui/colors';

/**
 * Radix UI Color token mapping for Cadence Design System
 * Injects CSS custom properties dynamically while preserving the Graphite/Iris/Apricot identity.
 */
export const radixTokens = {
  light: {
    ...mauve,
    ...iris,
    ...sand,
    ...orange,
  },
  dark: {
    ...mauveDark,
    ...irisDark,
    ...sandDark,
    ...orangeDark,
  },
};

