import React, { useState, useEffect, useCallback } from 'react';
import myAxios from '../services/myAxios';
import ChatWindow from './ChatWindow';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import WebSocketService from '../services/websocket';

const ChatDrawer = () => {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const currentUser = useSelector(state => state.auth.user);

    useEffect(() => {
        if (isDrawerOpen) {
            fetchConversations();
        }
    }, [isDrawerOpen]);

    useEffect(() => {
        // Gestionnaire pour les utilisateurs en ligne
        const handleOnlineUsers = (message) => {
            if (message.type === 'online_users') {
                // Filtrer l'utilisateur actuel de la liste
                const filteredUsers = message.data.filter(user => user._id !== currentUser.id);
                setOnlineUsers(filteredUsers);
            }
        };

        WebSocketService.onMessage(handleOnlineUsers);

        return () => {
            WebSocketService.offMessage(handleOnlineUsers);
        };
    }, [currentUser.id]);

    const fetchConversations = async () => {
        try {
            console.log('Fetching conversations...');
            const response = await myAxios.get('/api/messages/conversations');
            console.log('Conversations received:', response.data);
            setConversations(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
        }
    };

    const searchUsers = async (query) => {
        console.log('Recherche utilisateurs avec:', query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            // Ajout de logs pour déboguer
            console.log('URL de recherche:', `/api/users/search?q=${encodeURIComponent(query)}`);
            console.log('Headers:', myAxios.defaults.headers);
            
            const response = await myAxios.get(`/api/users/search?q=${encodeURIComponent(query)}`);
            console.log('Résultats de recherche:', response.data);
            const filteredResults = response.data.filter(user => user._id !== currentUser.id);
            setSearchResults(filteredResults);
        } catch (error) {
            console.error('Erreur détaillée:', error.response || error);
            console.error('Erreur lors de la recherche:', error);
        }
    };

    // Ajout d'un délai pour éviter trop de requêtes
    const debouncedSearch = React.useCallback(
        debounce((query) => {
            searchUsers(query);
        }, 300),
        []
    );

    const startNewConversation = (user) => {
        setActiveChat(user);
        setShowUserSearch(false);
        setSearchQuery('');
        setSearchResults([]);
        // Ajouter la nouvelle conversation à la liste si elle n'existe pas déjà
        if (!conversations.find(conv => conv._id === user._id)) {
            setConversations(prev => [...prev, { 
                _id: user._id, 
                username: user.username,
                lastMessage: null
            }]);
        }
    };

    const handleMessageSent = useCallback(async () => {
        console.log('Message envoyé, rafraîchissement des conversations');
        await fetchConversations();
    }, []);

    const toggleDrawer = () => {
        const newState = !isDrawerOpen;
        setIsDrawerOpen(newState);
        if (newState) {
            fetchConversations();
        }
    };

    return (
        <div className="chat-drawer">
            {/* Chat actif */}
            {activeChat && (
                <ChatWindow 
                    receiverId={activeChat._id}
                    username={activeChat.username}
                    onClose={() => {
                        setActiveChat(null);
                        fetchConversations(); // Rafraîchir les conversations à la fermeture
                    }}
                    onMessageSent={handleMessageSent}
                />
            )}

            {/* Drawer des conversations */}
            <div className="chat-conversations">
                {/* Header du drawer */}
                <div 
                    className="chat-header"
                    onClick={toggleDrawer}
                >
                    <span>Messages ({conversations.length})</span>
                    <span>{isDrawerOpen ? '▼' : '▲'}</span>
                </div>

                {/* Liste des conversations */}
                {isDrawerOpen && (
                    <div className="chat-messages-container">
                        <div className="new-conversation-section">
                            {!showUserSearch ? (
                                <button 
                                    className="new-conversation-button"
                                    onClick={() => setShowUserSearch(true)}
                                >
                                    Nouvelle conversation
                                </button>
                            ) : (
                                <div className="user-search-container">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const newQuery = e.target.value;
                                            setSearchQuery(newQuery);
                                            debouncedSearch(newQuery);
                                        }}
                                        placeholder="Rechercher un utilisateur..."
                                        className="user-search-input"
                                    />
                                    <div className="search-results">
                                        {searchResults.map(user => (
                                            <div
                                                key={user._id}
                                                className="search-result-item"
                                                onClick={() => startNewConversation(user)}
                                            >
                                                <div className="chat-avatar">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{user.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section des utilisateurs en ligne */}
                        <div className="online-users-section">
                            <h3 className="section-title">Utilisateurs en ligne</h3>
                            {onlineUsers.length === 0 ? (
                                <div className="no-users-online">
                                    Aucun utilisateur en ligne
                                </div>
                            ) : (
                                onlineUsers.map(user => (
                                    <div
                                        key={user._id}
                                        className="online-user-item"
                                        onClick={() => startNewConversation(user)}
                                    >
                                        <div className="chat-avatar">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="user-info">
                                            <span className="username">{user.username}</span>
                                            <span className="online-indicator"></span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {conversations.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--y-secondary-text)' }}>
                                Aucune conversation
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv._id}
                                    className="chat-conversation-item"
                                    onClick={() => setActiveChat(conv)}
                                    style={{
                                        backgroundColor: activeChat?._id === conv._id ? '#f0f0f0' : 'white'
                                    }}
                                >
                                    <div className="chat-avatar">
                                        {conv.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{conv.username}</div>
                                        {conv.lastMessage && (
                                            <div className="chat-message-preview">
                                                {conv.lastMessage}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatDrawer; 