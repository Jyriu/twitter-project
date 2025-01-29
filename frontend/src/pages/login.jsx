import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../redux/slices/authSlice';
import MyAxios from '../services/myAxios';
import './login.css';
import { removeCookie } from '../services/cookieService';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      removeCookie('token');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(formData)).unwrap();
      // La redirection sera gérée par le useEffect
    } catch (err) {
      // L'erreur est déjà gérée dans le state
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {status === 'loading' && <div>Connexion en cours...</div>}
        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="login-button" disabled={status === 'loading'}>
          {status === 'loading' ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className="register-link">
          Pas encore de compte ? <span onClick={() => navigate('/register')}>Inscrivez-vous ici</span>
        </p>
      </form>
    </div>
  );
};

export default Login;
