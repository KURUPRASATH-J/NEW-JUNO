import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@juno_ai_token',
  THEME: '@juno_ai_theme',
  USER_DATA: '@juno_ai_user_data',
};

// ── Auth Token ──────────────────────────────────────────────────────

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.TOKEN);
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
};

export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// ── Theme Preference ───────────────────────────────────────────────

export const getTheme = async () => {
  try {
    const theme = await AsyncStorage.getItem(KEYS.THEME);
    return theme || 'system';
  } catch (error) {
    console.error('Error reading theme preference:', error);
    return 'system';
  }
};

export const setTheme = async (theme) => {
  try {
    await AsyncStorage.setItem(KEYS.THEME, theme);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
};

// Aliases used by ThemeContext
export const getThemeMode = getTheme;
export const setThemeMode = setTheme;

// ── User Data ──────────────────────────────────────────────────────

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading user data:', error);
    return null;
  }
};

export const setUserData = async (data) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

// ── Clear All ──────────────────────────────────────────────────────

export const clearAll = async () => {
  try {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// ── Default export (object form) ───────────────────────────────────

const storage = {
  getToken,
  setToken,
  removeToken,
  getTheme,
  setTheme,
  getThemeMode,
  setThemeMode,
  getUserData,
  setUserData,
  clearAll,
};

export default storage;
