import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setCookie, getCookie, removeCookie } from '../../services/cookieService';
import MyAxios from '../../services/myAxios';

// Thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await MyAxios.post('/api/auth/login', credentials);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur de connexion';
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await MyAxios.post('/api/auth/register', userData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur d\'inscription';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  status: 'idle',
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.status = 'idle';
      removeCookie('token');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        setCookie('token', action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        removeCookie('token');
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 