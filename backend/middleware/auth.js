const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	try {
		console.log('Headers reçus:', req.headers);
		const token = req.headers.authorization?.split(' ')[1];
		console.log('Token extrait:', token);

		if (!token) {
			console.log('Pas de token trouvé');
			return res.status(401).json({ message: 'Authentification requise' });
		}

		const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
		console.log('Token décodé:', decodedToken);
		req.user = { id: decodedToken.userId };
		console.log('User dans req:', req.user);
		next();
	} catch (error) {
		console.error('Erreur auth:', error);
		res.status(401).json({ message: 'Authentification requise' });
	}
};
