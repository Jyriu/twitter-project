const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Récupérer tous les posts
router.get('/posts', auth, async (req, res) => {
	try {
		const posts = await Post.find()
			.populate('author', 'username')
			.sort({ createdAt: -1 });
		res.json(posts);
	} catch (err) {
		console.error('Erreur lors de la récupération des posts:', err);
		res.status(500).json({ message: 'Erreur serveur' });
	}
});

// Créer un nouveau post
router.post('/posts', auth, async (req, res) => {
	try {
		const newPost = new Post({
			content: req.body.content,
			author: req.user.id
		});

		const savedPost = await newPost.save();
		const populatedPost = await savedPost.populate('author', 'username');
		res.status(201).json(populatedPost);
	} catch (err) {
		console.error('Erreur lors de la création du post:', err);
		res.status(500).json({ message: 'Erreur serveur' });
	}
});

// Supprimer un post
router.delete('/posts/:id', auth, async (req, res) => {
	console.log('=== DELETE POST REQUEST ===');
	console.log('Post ID:', req.params.id);
	console.log('User:', req.user);
	console.log('Headers:', req.headers);

	try {
		const post = await Post.findById(req.params.id);
		console.log('Found post:', post);
		
		if (!post) {
			console.log('Post not found');
			return res.status(404).json({ message: 'Post non trouvé' });
		}

		// Vérifier que l'utilisateur est l'auteur du post
		console.log('Post author:', post.author);
		console.log('Current user:', req.user.id);
		
		if (post.author.toString() !== req.user.id) {
			console.log('Unauthorized - not the author');
			return res.status(403).json({ message: 'Non autorisé' });
		}

		await post.deleteOne();
		console.log('Post successfully deleted');
		res.json({ message: 'Post supprimé' });
	} catch (err) {
		console.error('Delete error:', err);
		res.status(500).json({ message: 'Erreur serveur' });
	}
});

module.exports = router;
