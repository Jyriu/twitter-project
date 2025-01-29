import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import {
  fetchPosts,
  createPost,
  deletePost,
} from '../redux/slices/postSlice';
import './dashboard.css';
import { FaTrash } from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { posts, status, error, hasMore } = useSelector((state) => state.posts); // Assurez-vous que `hasMore` est bien dans votre slice
  const [newPost, setNewPost] = useState('');
  const [page, setPage] = useState(1); // Suivi de la page actuelle

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login');
    } else {
      console.log('Authenticated, user:', user);
      dispatch(fetchPosts({ page, limit: 10 })); // Charger les posts de la première page
    }
  }, [isAuthenticated, navigate, dispatch, user]);

  // Fonction pour gérer l'infinite scroll
  const handleScroll = useCallback(() => {
    const bottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 2;
    if (bottom && hasMore && status !== 'loading') { // Vérifier si on peut encore charger des posts
      setPage((prevPage) => prevPage + 1); // Passer à la page suivante
    }
  }, [hasMore, status]);

  useEffect(() => {
    // Ajouter un écouteur pour le défilement
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (page > 1) {
      // Lorsque la page change, on charge plus de posts
      dispatch(fetchPosts({ page, limit: 10 }));
    }
  }, [page, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await dispatch(createPost(newPost)).unwrap();
      setNewPost('');
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleDeletePost = async (postId) => {
    console.log('Attempting to delete post:', postId);
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      try {
        await dispatch(deletePost(postId)).unwrap();
        console.log('Post deleted successfully');
      } catch (err) {
        console.error('Failed to delete post:', err);
      }
    }
  };

  return (
    <div className="app-container">
      <button onClick={handleLogout} className="logout-button-fixed">
        Déconnexion
      </button>

      <aside className="sidebar-left">
        <nav className="main-nav">
          <div className="user-profile">
            <div className="user-profile-header">
              <div className="user-avatar" />
              <div className="user-info-sidebar">
                <span className="user-name">{user?.username}</span>
                <span className="user-handle">@{user?.username}</span>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      <main className="dashboard-container">
        <header className="dashboard-header">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher"
            />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="post-form">
          <div className="post-form-content">
            <div className="user-avatar" />
            <div className="post-input-area">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Quoi de neuf ?"
                maxLength={280}
              />
              <div className="post-form-footer">
                <div className="post-actions">
                  {/* Ajouter ici les icônes d'action (image, gif, etc.) */}
                </div>
                <button type="submit" disabled={!newPost.trim()}>
                  Poster
                </button>
              </div>
            </div>
          </div>
        </form>

        {status === 'loading' && <div className="loading-spinner">Chargement...</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="posts-container">
          {posts.map((post) => (
            <article key={post._id} className="post">
              <div className="user-avatar" />
              <div className="post-main-content">
                <div className="post-header">
                  <div className="post-meta">
                    <span className="username">@{post.author.username}</span>
                    <span className="date">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {user?.username === post.author.username && (
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="delete-post-button"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
                <p className="post-content">{post.content}</p>
                <div className="post-actions">
                  {/* Ajouter ici les boutons d'action (like, repost, etc.) */}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
