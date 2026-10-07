/**
 * ChatContext.js — Fixed version
 * Manages chat state and API integration for Juno AI.
 */
import React, { createContext, useContext, useReducer, useCallback, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function createMessage(overrides) {
  return {
    id: generateId(),
    type: 'user',
    text: '',
    timestamp: new Date().toISOString(),
    hasContext: false,
    isEdited: false,
    ...overrides,
  };
}

const initialState = {
  messages: [],
  isTyping: false,
  activePersona: 'default',
  documentStatus: null,
  sessionId: null,
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_LAST_BOT_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 && msg.type === 'bot'
            ? { ...msg, ...action.payload }
            : msg,
        ),
      };
    case 'EDIT_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === action.payload.index
            ? { ...msg, text: action.payload.text, isEdited: true }
            : msg,
        ),
      };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_PERSONA':
      return { ...state, activePersona: action.payload };
    case 'SET_DOCUMENT_STATUS':
      return { ...state, documentStatus: action.payload };
    case 'SET_SESSION':
      return { ...state, sessionId: action.payload };
    case 'CLEAR_CHAT':
      return { ...initialState, activePersona: state.activePersona };
    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { token } = useAuth();
  const [pendingInput, setPendingInput] = useState('');

  // FIX: Pass token as a plain string, not an object
  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      const userMsg = createMessage({ type: 'user', text: text.trim() });
      dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
      dispatch({ type: 'SET_TYPING', payload: true });

      try {
        // Use non-streaming endpoint - more reliable for mobile
        const response = await api.sendMessage(text.trim(), token);

        // Backend returns 'response', not 'message'
        const botText = response.response || response.message || response.text || 'No response received.';

        const botMsg = createMessage({
          type: 'bot',
          text: botText,
          hasContext: !!response.has_context,
        });
        dispatch({ type: 'ADD_MESSAGE', payload: botMsg });

        if (response.session_id && !state.sessionId) {
          dispatch({ type: 'SET_SESSION', payload: response.session_id });
        }
      } catch (e) {
        const errorMsg = createMessage({
          type: 'bot',
          text: `⚠️ ${e.message || 'Sorry, something went wrong. Please try again.'}`,
        });
        dispatch({ type: 'ADD_MESSAGE', payload: errorMsg });
        console.log('sendMessage error:', e);
      } finally {
        dispatch({ type: 'SET_TYPING', payload: false });
      }
    },
    [token, state.sessionId, state.activePersona],
  );

  const uploadDocument = useCallback(
    async (fileUri, fileName) => {
      try {
        dispatch({ type: 'SET_TYPING', payload: true });
        const response = await api.uploadDocument(fileUri, fileName, token);

        dispatch({
          type: 'SET_DOCUMENT_STATUS',
          payload: { filename: fileName, chunks: response.chunks ?? null, summary: response.summary ?? null },
        });

        const confirmMsg = createMessage({
          type: 'bot',
          text: `📄 Document "${fileName}" uploaded successfully.\n\n${response.summary || 'You can now ask questions about it.'}`,
          hasContext: true,
        });
        dispatch({ type: 'ADD_MESSAGE', payload: confirmMsg });
        return response;
      } catch (e) {
        const errorMsg = createMessage({ type: 'bot', text: `Failed to upload "${fileName}". ${e.message}` });
        dispatch({ type: 'ADD_MESSAGE', payload: errorMsg });
        throw e;
      } finally {
        dispatch({ type: 'SET_TYPING', payload: false });
      }
    },
    [token, state.sessionId],
  );

  const scrapeUrl = useCallback(
    async (url) => {
      try {
        dispatch({ type: 'SET_TYPING', payload: true });
        const response = await api.scrapeUrl(url, token);
        const confirmMsg = createMessage({
          type: 'bot',
          text: `🔗 Content from "${url}" loaded successfully. Ask me anything about it!`,
          hasContext: true,
        });
        dispatch({ type: 'ADD_MESSAGE', payload: confirmMsg });
        return response;
      } catch (e) {
        const errorMsg = createMessage({ type: 'bot', text: `Failed to load content from "${url}". ${e.message}` });
        dispatch({ type: 'ADD_MESSAGE', payload: errorMsg });
        throw e;
      } finally {
        dispatch({ type: 'SET_TYPING', payload: false });
      }
    },
    [token, state.sessionId],
  );

  const clearChat = useCallback(async () => {
    try {
      await api.clearSession(token);
    } catch (e) {
      console.log('clearSession API error:', e);
    }
    dispatch({ type: 'CLEAR_CHAT' });
  }, [token]);

  const setPersona = useCallback(
    async (persona) => {
      try {
        await api.setPersona(persona, token);
      } catch (e) {
        console.log('setPersona API error:', e);
      }
      dispatch({ type: 'SET_PERSONA', payload: persona });
    },
    [token],
  );

  const editMessage = useCallback(
    async (index, newText) => {
      dispatch({ type: 'EDIT_MESSAGE', payload: { index, text: newText } });
      try {
        await api.editMessage(index, newText, token);
      } catch (e) {
        console.log('editMessage API error:', e);
      }
    },
    [token],
  );

  return (
    <ChatContext.Provider
      value={{
        messages: state.messages,
        isTyping: state.isTyping,
        activePersona: state.activePersona,
        documentStatus: state.documentStatus,
        sessionId: state.sessionId,
        pendingInput,
        dispatch,
        sendMessage,
        uploadDocument,
        scrapeUrl,
        clearChat,
        setPersona,
        editMessage,
        setPendingInput,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}

export default ChatContext;
