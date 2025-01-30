import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import WebSocketService from '../services/websocket';
import axios from 'axios';

const Chat = () => {
    const { receiverId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Charger l'historique des messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`/api/messages/conversation/${receiverId}`);
                setMessages(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des messages:', error);
                setLoading(false);
            }
        };

        fetchMessages();
    }, [receiverId]);

    // Gérer la connexion WebSocket
    useEffect(() => {
        let mounted = true;

        const initializeWebSocket = () => {
            if (mounted) {
                console.log('Initialisation du WebSocket dans Chat');
                WebSocketService.connect();
            }
        };

        // Ne connecter que si pas déjà connecté
        if (!WebSocketService.ws || WebSocketService.ws.readyState !== WebSocket.OPEN) {
            initializeWebSocket();
        }

        const messageHandler = (message) => {
            if (mounted && message.type === 'message') {
                setMessages(prev => [...prev, message.data]);
                scrollToBottom();
            }
        };

        WebSocketService.onMessage(messageHandler);

        return () => {
            mounted = false;
            WebSocketService.offMessage(messageHandler);
            // Ne pas déconnecter le WebSocket ici, car il peut être utilisé par d'autres composants
        };
    }, []);

    // Scroll vers le bas quand les messages changent
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatDate = (date) => {
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const sendMessage = () => {
        if (newMessage.trim()) {
            WebSocketService.sendMessage(receiverId, newMessage);
            setNewMessage('');
        }
    };

    if (loading) {
        return <div>Chargement des messages...</div>;
    }

    return (
        <div className="chat-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2>Conversation</h2>
            <div className="messages-container" style={{ 
                height: '500px', 
                overflowY: 'auto', 
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#f8f9fa'
            }}>
                {messages.map((msg, index) => (
                    <div 
                        key={msg._id || index} 
                        className={`message ${msg.sender === receiverId ? 'received' : 'sent'}`}
                        style={{
                            marginBottom: '15px',
                            maxWidth: '70%',
                            marginLeft: msg.sender === receiverId ? '0' : 'auto',
                            marginRight: msg.sender === receiverId ? 'auto' : '0'
                        }}
                    >
                        <div style={{
                            backgroundColor: msg.sender === receiverId ? '#e9ecef' : '#007bff',
                            color: msg.sender === receiverId ? '#000' : '#fff',
                            padding: '10px 15px',
                            borderRadius: '15px',
                            position: 'relative'
                        }}>
                            <div style={{ marginBottom: '5px', fontSize: '0.9em', fontWeight: 'bold' }}>
                                {msg.sender.username || (msg.sender === receiverId ? 'Destinataire' : 'Vous')}
                            </div>
                            <div style={{ marginBottom: '5px' }}>{msg.content}</div>
                            <div style={{ 
                                fontSize: '0.7em', 
                                opacity: 0.8,
                                textAlign: 'right'
                            }}>
                                {formatDate(msg.sentAt)}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="message-input" style={{ 
                display: 'flex', 
                gap: '10px',
                marginTop: '20px' 
            }}>
                <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    style={{ 
                        flex: 1, 
                        padding: '12px',
                        borderRadius: '25px',
                        border: '1px solid #ddd',
                        outline: 'none'
                    }}
                    placeholder="Écrivez votre message..."
                />
                <button 
                    onClick={sendMessage}
                    style={{ 
                        padding: '12px 24px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer'
                    }}
                >
                    Envoyer
                </button>
            </div>
        </div>
    );
};

export default Chat; 