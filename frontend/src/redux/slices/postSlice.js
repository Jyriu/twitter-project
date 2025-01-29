import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import MyAxios from '../../services/myAxios';

// Thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await MyAxios.get('/api/forum/posts');
      return response.data;
    } catch (err) {
      return rejectWithValue('Erreur lors du chargement des posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (content, { rejectWithValue }) => {
    try {
      const response = await MyAxios.post('/api/forum/posts', { content });
      return response.data;
    } catch (err) {
      return rejectWithValue('Erreur lors de la création du post');
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await MyAxios.delete(`/api/forum/posts/${postId}`);
      return postId;
    } catch (err) {
      console.error('Delete error:', err.response?.data);
      return rejectWithValue(err.response?.data?.message || 'Erreur lors de la suppression du post');
    }
  }
);

const initialState = {
  posts: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts = action.payload;
        state.error = null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Create post
      .addCase(createPost.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts.unshift(action.payload);
        state.error = null;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Delete post
      .addCase(deletePost.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts = state.posts.filter(post => post._id !== action.payload);
        state.error = null;
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearError } = postSlice.actions;
export default postSlice.reducer; 