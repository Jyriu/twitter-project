class WebSocketService {
    constructor() {
        this.ws = null;
        this.messageHandlers = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.isIntentionalClose = false;
        this.connectionPromise = null;
    }

    connect() {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                const wsPort = process.env.REACT_APP_WS_PORT || 3002;
                console.log('Tentative de connexion WebSocket sur le port:', wsPort);

                this.ws = new WebSocket(`ws://localhost:${wsPort}`);

                this.ws.onopen = () => {
                    console.log('✅ Connexion WebSocket établie');
                    this.reconnectAttempts = 0;
                    this.isIntentionalClose = false;
                    this.connectionPromise = null;
                    resolve();
                };

                this.ws.onerror = (error) => {
                    console.error('❌ Erreur WebSocket:', error);
                    this.connectionPromise = null;
                    reject(new Error('Erreur de connexion WebSocket'));
                };

                this.ws.onclose = (event) => {
                    console.log('Connexion WebSocket fermée', event.code, event.reason);
                    this.connectionPromise = null;
                    
                    if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
                        const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
                        console.log(`Tentative de reconnexion dans ${timeout/1000} secondes...`);
                        this.reconnectAttempts++;
                        setTimeout(() => this.connect(), timeout);
                    }
                };

                this.ws.onmessage = this.handleMessage.bind(this);

            } catch (error) {
                console.error('❌ Erreur lors de la création du WebSocket:', error);
                this.connectionPromise = null;
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('Message WebSocket reçu:', message);
            this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
            throw error;
        }
    }

    sendMessage(receiverId, content) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.log('WebSocket non connecté, tentative de reconnexion...');
            return this.connect().then(() => {
                this.sendMessage(receiverId, content);
            });
        }

        const messageData = {
            type: 'message',
            data: {
                receiver: receiverId,
                content: content
            }
        };
        console.log('Envoi du message WebSocket:', messageData);
        this.ws.send(JSON.stringify(messageData));
    }

    onMessage(handler) {
        this.messageHandlers.add(handler);
    }

    offMessage(handler) {
        this.messageHandlers.delete(handler);
    }

    disconnect() {
        if (this.ws) {
            this.isIntentionalClose = true;
            this.ws.close();
            this.ws = null;
        }
    }
}

export default new WebSocketService(); 