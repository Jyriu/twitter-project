require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const forumRoutes = require('./routes/forum');

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5060;
app.listen(PORT, () => {
	console.log(`Serveur démarré sur le port ${PORT}`);
});
