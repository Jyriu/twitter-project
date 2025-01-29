import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postReducer from './slices/postSlice';

// Configuration des DevTools
const devToolsOptions = {
  name: 'Y Social App',
  trace: true,
  traceLimit: 25,
  actionsBlacklist: [
    '@@INIT',
    'SET_CURRENT_LOCATION',
    'SHOW_BRANCH_BANNER',
    // Ajoutez ici d'autres actions à ignorer
  ]
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
  },
  devTools: process.env.NODE_ENV !== 'production' ? devToolsOptions : false,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore ces actions dans le check de sérialisation
        ignoredActions: ['register/rejected', 'login/rejected'],
      },
    }),
});

// Nettoyage du store au démarrage
if (process.env.NODE_ENV === 'development') {
  window.store = store;
  // Réinitialiser le state au démarrage
  store.dispatch({ type: 'RESET_STATE' });
}

// Ajout d'un middleware de debug en développement
if (process.env.NODE_ENV === 'development') {
  store.subscribe(() => {
    const state = store.getState();
    console.log('Current state:', state);
  });
}