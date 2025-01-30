const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const User = require('../models/User');

router.get('/conversation/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.id }
            ]
        })
        .sort({ sentAt: 1 })
        .populate('sender', 'username');

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des messages" });
    }
});

router.get('/conversations', auth, async (req, res) => {
    try {
        console.log('Récupération des conversations pour l\'utilisateur:', req.user.id);
        
        // Vérifier que l'ID est valide
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
            console.error('ID utilisateur invalide:', req.user.id);
            return res.status(400).json({ message: "ID utilisateur invalide" });
        }

        // Vérifier que l'utilisateur existe
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            console.error('Utilisateur non trouvé:', req.user.id);
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Trouver tous les messages uniques par conversation
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(req.user.id) },
                        { receiver: new mongoose.Types.ObjectId(req.user.id) }
                    ]
                }
            },
            {
                $sort: { sentAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ['$sender', new mongoose.Types.ObjectId(req.user.id)] },
                            then: '$receiver',
                            else: '$sender'
                        }
                    },
                    lastMessage: { $first: '$content' },
                    lastMessageDate: { $first: '$sentAt' }
                }
            }
        ]).exec(); // Ajout de .exec() pour une meilleure gestion des erreurs

        console.log('Conversations trouvées:', JSON.stringify(conversations, null, 2));

        if (!conversations || conversations.length === 0) {
            console.log('Aucune conversation trouvée');
            return res.json([]);
        }

        // Récupérer les informations des utilisateurs
        const conversationsWithUsers = await Promise.all(
            conversations.map(async (conv) => {
                try {
                    if (!conv._id) {
                        console.log('ID de conversation manquant:', conv);
                        return null;
                    }

                    const otherUser = await User.findById(conv._id);
                    if (!otherUser) {
                        console.log('Utilisateur non trouvé pour la conversation:', conv._id);
                        return null;
                    }

                    return {
                        _id: otherUser._id,
                        username: otherUser.username,
                        lastMessage: conv.lastMessage,
                        lastMessageDate: conv.lastMessageDate
                    };
                } catch (error) {
                    console.error('Erreur pour la conversation:', conv._id, error);
                    return null;
                }
            })
        );

        // Filtrer les conversations nulles
        const validConversations = conversationsWithUsers.filter(conv => conv !== null);

        console.log('Conversations valides:', JSON.stringify(validConversations, null, 2));
        res.json(validConversations);

    } catch (error) {
        console.error('Erreur détaillée lors de la récupération des conversations:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            message: "Erreur lors de la récupération des conversations",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router; 