require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const forumRoutes = require('./routes/forum');
const wsServer = require('./websocket/wsServer');
const http = require('http');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Log toutes les requêtes
app.use((req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});

// Déboguer les variables d'environnement
console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('Port:', process.env.PORT);

// Connexion à MongoDB avec plus de détails d'erreur
mongoose.connect(process.env.MONGODB_URI)
	.then(() => console.log('Connecté à MongoDB'))
	.catch(err => {
		console.error('Erreur détaillée de connexion MongoDB:', err);
		process.exit(1);  // Arrêter le serveur en cas d'erreur
	});

app.use('/api/forum', forumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Route de test
app.get('/api/test', (req, res) => {
	res.json({ message: 'API fonctionne' });
});

// Initialiser le WebSocket après la création du serveur HTTP
const WS_PORT = process.env.WS_PORT || 3002;
wsServer.initialize(WS_PORT);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`Serveur HTTP démarré sur le port ${PORT}`);
});
