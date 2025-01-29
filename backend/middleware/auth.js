const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
	try {
		const token = req.headers.authorization.split(' ')[1];
		const decodedToken = jwt.verify(token, JWT_SECRET);
		req.user = { id: decodedToken.userId };
		next();
	} catch (error) {
		res.status(401).json({ message: 'Authentification requise' });
	}
};
