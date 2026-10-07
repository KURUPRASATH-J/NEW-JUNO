/**
 * ThemeContext.js
 *
 * Theme context for the Juno AI app.
 * Supports three modes: 'light', 'dark', and 'system' (follows OS preference).
 *
 * On mount the provider:
 *  1. Loads the saved mode preference from AsyncStorage.
 *  2. Subscribes to React Native's Appearance API so "system" mode
 *     reacts to OS-level dark/light changes in real-time.
 *
 * Exposes `setMode(mode)` and a convenience `toggleTheme()` that
 * cycles through light → dark → system.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Appearance } from 'react-native';
import colors from '../constants/colors';
import { getThemeMode, setThemeMode } from '../utils/storage';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ThemeContext = createContext();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The three supported modes in cycle order. */
const MODES = ['light', 'dark', 'system'];

/**
 * Resolve the effective dark/light boolean for a given mode.
 * When mode is 'system' we defer to the OS color-scheme.
 */
function resolveIsDark(mode) {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  // 'system' – read the OS preference
  return Appearance.getColorScheme() === 'dark';
}

/**
 * Return the matching color palette for a dark/light flag.
 */
function resolveColors(isDark) {
  return isDark ? colors.dark : colors.light;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('system');           // 'light' | 'dark' | 'system'
  const [isDark, setIsDark] = useState(resolveIsDark('system'));
  const [isLoaded, setIsLoaded] = useState(false);

  // Derive the color palette whenever isDark changes
  const currentColors = useMemo(() => resolveColors(isDark), [isDark]);

  // ------------------------------------------------------------------
  // 1. Restore saved preference on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const saved = await getThemeMode();
        if (saved && MODES.includes(saved)) {
          setModeState(saved);
          setIsDark(resolveIsDark(saved));
        }
      } catch (e) {
        console.log('Failed to load theme preference:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // ------------------------------------------------------------------
  // 2. Listen for OS appearance changes (only matters when mode=system)
  // ------------------------------------------------------------------
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (mode === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription.remove();
  }, [mode]);

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Set the theme mode explicitly.
   * Persists the choice to AsyncStorage.
   *
   * @param {'light'|'dark'|'system'} newMode
   */
  const setMode = useCallback(async (newMode) => {
    if (!MODES.includes(newMode)) return;

    setModeState(newMode);
    setIsDark(resolveIsDark(newMode));

    try {
      await setThemeMode(newMode);
    } catch (e) {
      console.log('Failed to save theme preference:', e);
    }
  }, []);

  /**
   * Cycle through light → dark → system → light …
   */
  const toggleTheme = useCallback(() => {
    const nextIndex = (MODES.indexOf(mode) + 1) % MODES.length;
    setMode(MODES[nextIndex]);
  }, [mode, setMode]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors: currentColors,
      setMode,
      toggleTheme,
      isLoaded,
    }),
    [mode, isDark, currentColors, setMode, toggleTheme, isLoaded],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Convenience hook – enforces that consumers are rendered inside
 * a <ThemeProvider>.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
