import React from 'react';
import { useEffect, useState, useRef } from 'react';
import WebSocketService from '../services/websocket';
import myAxios from '../services/myAxios';
import { useSelector } from 'react-redux';

const ChatWindow = ({ receiverId, username, onClose, onMessageSent }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const currentUser = useSelector(state => state.auth.user);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const initializeChat = async () => {
            try {
                if (!WebSocketService.ws || WebSocketService.ws.readyState !== WebSocket.OPEN) {
                    await WebSocketService.connect();
                }
                const response = await myAxios.get(`/api/messages/conversation/${receiverId}`);
                const formattedMessages = response.data.map(msg => ({
                    ...msg,
                    sender: msg.sender._id || msg.sender,
                    isOwnMessage: msg.sender._id === currentUser.id || msg.sender === currentUser.id
                }));
                setMessages(formattedMessages);
                scrollToBottom();
                setError(null);
            } catch (error) {
                console.error('Erreur lors de l\'initialisation du chat:', error);
                setError('Erreur de connexion au chat');
            }
        };

        initializeChat();
    }, [receiverId, currentUser.id]);

    useEffect(() => {
        const messageHandler = (message) => {
            try {
                console.log('Message reçu dans ChatWindow:', message);
                if (message.type === 'message') {
                    const { sender, receiver, id } = message.data;
                    if ((sender === receiverId || receiver === receiverId) && 
                        !messages.some(m => m._id === id || m._id === message.data.id)) {
                        console.log('Ajout du message à la conversation');
                        setMessages(prev => [...prev, {
                            ...message.data,
                            isOwnMessage: sender === currentUser.id
                        }]);
                        scrollToBottom();
                    }
                }
            } catch (error) {
                console.error('Erreur lors du traitement du message:', error);
                setError('Erreur lors de la réception du message');
            }
        };

        WebSocketService.onMessage(messageHandler);

        return () => {
            WebSocketService.offMessage(messageHandler);
        };
    }, [receiverId, currentUser.id, messages]);

    const sendMessage = async () => {
        if (newMessage.trim()) {
            try {
                setError(null);
                await WebSocketService.sendMessage(receiverId, newMessage);
                setNewMessage('');
                if (onMessageSent) onMessageSent();
            } catch (error) {
                console.error('Erreur lors de l\'envoi du message:', error);
                setError('Erreur lors de l\'envoi du message');
            }
        }
    };

    if (error) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '4px',
                margin: '10px'
            }}>
                {error}
                <button 
                    onClick={() => setError(null)}
                    style={{
                        marginLeft: '10px',
                        padding: '5px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div style={{
            width: '300px',
            backgroundColor: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            flexDirection: 'column',
            height: isMinimized ? 'auto' : '400px'
        }}>
            {/* Header */}
            <div style={{
                padding: '10px',
                backgroundColor: 'var(--y-blue)',
                color: 'white',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
            }}>
                <span style={{ fontWeight: 'bold' }}>{username}</span>
                <div>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            marginRight: '8px'
                        }}
                    >
                        {isMinimized ? '▲' : '▼'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Corps du chat */}
            {!isMinimized && (
                <>
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {messages.map((msg, index) => (
                            <div
                                key={msg._id || index}
                                style={{
                                    alignSelf: msg.isOwnMessage ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    margin: '5px'
                                }}
                            >
                                <div style={{
                                    backgroundColor: msg.isOwnMessage ? 'var(--y-blue)' : '#e9ecef',
                                    color: msg.isOwnMessage ? '#fff' : '#000',
                                    padding: '8px 12px',
                                    borderRadius: '15px',
                                    wordBreak: 'break-word'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '10px',
                        borderTop: '1px solid #eee',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Écrivez un message..."
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '20px',
                                border: '1px solid #ddd',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            style={{
                                padding: '8px 15px',
                                backgroundColor: 'var(--y-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer'
                            }}
                        >
                            Envoyer
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatWindow; 