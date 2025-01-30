const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Route de test pour vérifier que le routeur fonctionne
router.get('/test', (req, res) => {
    res.json({ message: 'Route users fonctionne' });
});

router.get('/search', auth, async (req, res) => {
    try {
        const query = req.query.q;
        console.log('Recherche utilisateurs avec query:', query);

        if (!query) {
            return res.json([]);
        }

        // Recherche des utilisateurs dont le username contient la query
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.id } // Exclure l'utilisateur actuel
        })
        .select('username _id')
        .limit(10);

        console.log('Utilisateurs trouvés:', users);
        res.json(users);
    } catch (error) {
        console.error('Erreur recherche utilisateurs:', error);
        res.status(500).json({ message: "Erreur lors de la recherche des utilisateurs" });
    }
});

// Ajoutez cette route temporaire pour vérifier les utilisateurs
router.get('/test-users', auth, async (req, res) => {
    try {
        const users = await User.find().select('username _id');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Erreur" });
    }
});

module.exports = router; 