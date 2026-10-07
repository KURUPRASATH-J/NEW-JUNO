/**
 * AuthContext.js
 * 
 * Authentication context for the Juno AI app.
 * Manages user session state (token, user data, loading, auth status)
 * using useReducer for predictable state transitions.
 * 
 * On mount, attempts to restore a saved session from AsyncStorage
 * and validates it against the backend. Exposes login, register,
 * and logout methods that coordinate API calls with local persistence.
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';
import {
  getToken,
  setToken,
  removeToken,
  getUserData,
  setUserData,
  clearAll,
} from '../utils/storage';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext();

// ---------------------------------------------------------------------------
// State & Reducer
// ---------------------------------------------------------------------------
const initialState = {
  user: null,       // { name, email }
  token: null,      // JWT / session token
  isLoading: true,  // true while restoring session on app launch
  isAuthenticated: false,
};

/**
 * Pure reducer – every auth transition is an explicit action so the
 * state machine is easy to reason about and debug.
 */
function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'LOGOUT':
      return { ...initialState, isLoading: false };

    case 'LOADING_DONE':
      return { ...state, isLoading: false };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Attempt to restore a previous session on first mount
  useEffect(() => {
    restoreSession();
  }, []);

  /**
   * Checks AsyncStorage for a persisted token, then validates it with
   * the backend. If valid the session is restored silently; otherwise
   * the loading flag is simply cleared so the auth screens can render.
   */
  const restoreSession = async () => {
    try {
      const token = await getToken();

      if (token) {
        const response = await api.checkAuthStatus(token);

        if (response.authenticated) {
          // Prefer locally-cached user data; fall back to API response
          const userData = await getUserData();
          dispatch({
            type: 'RESTORE_SESSION',
            payload: {
              user: userData || { name: response.name, email: response.email },
              token,
            },
          });
          return;
        }
      }
    } catch (e) {
      console.log('Session restore failed:', e);
    }

    // No valid session found – stop the loading spinner
    dispatch({ type: 'LOADING_DONE' });
  };

  /**
   * Authenticate with email + password.
   * Persists the token and user data to AsyncStorage on success.
   */
  const login = async (email, password) => {
    const response = await api.login(email, password);
    const user = { name: response.name, email: response.email };

    await setToken(response.token);
    await setUserData(user);

    dispatch({ type: 'LOGIN', payload: { user, token: response.token } });
    return response;
  };

  /**
   * Create a new account.
   * Automatically logs the user in after successful registration.
   */
  const register = async (name, email, password) => {
    const response = await api.register(name, email, password);
    const user = { name: response.name, email: response.email };

    await setToken(response.token);
    await setUserData(user);

    dispatch({ type: 'LOGIN', payload: { user, token: response.token } });
    return response;
  };

  /**
   * Sign out – notifies the backend (best-effort), then wipes local storage.
   */
  const logout = async () => {
    try {
      if (state.token) await api.logout(state.token);
    } catch (e) {
      console.log('Logout API call failed:', e);
    }

    await clearAll();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Convenience hook – enforces that consumers are rendered inside
 * an <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
