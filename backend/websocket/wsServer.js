const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const cookie = require('cookie');

class WebSocketServer {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // userId -> ws
        this.onlineUsers = new Map(); // userId -> user info (pour éviter les doublons)
    }

    initialize(port) {
        try {
            console.log(`Démarrage du serveur WebSocket sur le port ${port}`);
            
            this.wss = new WebSocket.Server({ 
                port,
                // Ajout de la gestion des erreurs au niveau du serveur
                verifyClient: (info, cb) => {
                    console.log('Nouvelle tentative de connexion WebSocket');
                    cb(true); // Accepter toutes les connexions initialement
                }
            });

            this.wss.on('listening', () => {
                console.log('✅ Serveur WebSocket démarré avec succès sur le port', port);
            });

            this.wss.on('error', (error) => {
                console.error('❌ Erreur du serveur WebSocket:', error);
            });

            this.wss.on('connection', this.handleConnection.bind(this));

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du WebSocket:', error);
        }
    }

    async handleConnection(ws, req) {
        try {
            console.log('Nouvelle connexion WebSocket tentée');
            const cookies = cookie.parse(req.headers.cookie || '');
            console.log('Cookies reçus:', cookies);

            if (!cookies.token) {
                console.log('❌ Pas de token trouvé');
                ws.close(4001, 'Non autorisé - Token manquant');
                return;
            }

            try {
                const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
                const userId = decoded.userId;

                const user = await User.findById(userId);
                if (!user) {
                    console.log('❌ Utilisateur non trouvé');
                    ws.close(4002, 'Utilisateur non trouvé');
                    return;
                }

                console.log('✅ Utilisateur connecté:', user.username);
                
                // Stocker la connexion et l'utilisateur
                this.clients.set(userId, ws);
                this.onlineUsers.set(userId, {
                    _id: userId,
                    username: user.username
                });

                // Diffuser la nouvelle liste d'utilisateurs connectés
                this.broadcastOnlineUsers();

                ws.on('message', async (data) => {
                    try {
                        const messageData = JSON.parse(data);
                        await this.handleMessage(ws, userId, messageData);
                    } catch (error) {
                        console.error('❌ Erreur lors du traitement du message:', error);
                        ws.send(JSON.stringify({
                            type: 'error',
                            data: 'Erreur lors du traitement du message'
                        }));
                    }
                });

                ws.on('close', () => {
                    console.log('Utilisateur déconnecté:', userId);
                    this.clients.delete(userId);
                    this.onlineUsers.delete(userId);
                    this.broadcastOnlineUsers();
                });

                // Envoyer immédiatement la liste des utilisateurs en ligne au nouvel utilisateur
                ws.send(JSON.stringify({
                    type: 'online_users',
                    data: Array.from(this.onlineUsers.values())
                }));

            } catch (error) {
                console.error('❌ Erreur d\'authentification:', error);
                ws.close(4003, 'Token invalide');
            }

        } catch (error) {
            console.error('❌ Erreur lors de la gestion de la connexion:', error);
            ws.close(4000, 'Erreur interne');
        }
    }

    async handleMessage(ws, userId, messageData) {
        try {
            console.log('Message reçu de', userId, ':', messageData);
            
            const { receiver, content } = messageData.data;
            
            // Sauvegarder le message dans la base de données
            const message = new Message({
                content,
                sender: userId,
                receiver,
                sentAt: new Date()
            });
            
            await message.save();
            console.log('Message sauvegardé:', message);

            // Envoyer le message au destinataire
            const receiverWs = this.clients.get(receiver);
            const messageToSend = {
                type: 'message',
                data: {
                    id: message._id,
                    content,
                    sender: userId,
                    receiver,
                    sentAt: message.sentAt
                }
            };

            // Envoyer au destinataire s'il est connecté
            if (receiverWs) {
                console.log('Envoi au destinataire:', receiver);
                receiverWs.send(JSON.stringify(messageToSend));
            }

            // Renvoyer au sender pour confirmation
            console.log('Envoi de confirmation à l\'expéditeur:', userId);
            ws.send(JSON.stringify(messageToSend));

        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                data: 'Erreur lors de l\'envoi du message'
            }));
        }
    }

    broadcastOnlineUsers() {
        console.log('Diffusion de la liste des utilisateurs en ligne');
        const onlineUsersList = Array.from(this.onlineUsers.values());
        console.log('Utilisateurs en ligne:', onlineUsersList);

        const message = {
            type: 'online_users',
            data: onlineUsersList
        };

        this.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

module.exports = new WebSocketServer(); 