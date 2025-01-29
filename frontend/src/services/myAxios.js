import axios from 'axios';
import { getCookie, removeCookie } from './cookieService';

const MyAxios = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour les requêtes
MyAxios.interceptors.request.use(
  (config) => {
    const token = getCookie('token');
    console.log('Token from cookie:', token); // Debug
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
MyAxios.interceptors.response.use(
  (response) => {
    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('Response:', {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('Response error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      removeCookie('token');
      window.location.href = '/login';
    }

    // Gestion des erreurs de réseau
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(new Error('Erreur réseau. Veuillez vérifier votre connexion.'));
    }

    // Gestion des timeouts
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('La requête a pris trop de temps. Veuillez réessayer.'));
    }

    return Promise.reject(error);
  }
);

export default MyAxios; 