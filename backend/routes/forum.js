const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Récupérer les posts avec pagination
router.get('/posts', auth, async (req, res) => {
  try {
    // Récupérer la page et la limite depuis les paramètres de la requête
    const page = parseInt(req.query.page) || 1; // Page actuelle, par défaut 1
    const limit = parseInt(req.query.limit) || 10; // Nombre de posts par page, par défaut 10
    
    // Calculer l'offset pour "skip"
    const skip = (page - 1) * limit;
    
    // Récupérer les posts avec la pagination
    const posts = await Post.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip) // Skipper les posts des pages précédentes
      .limit(limit); // Limiter le nombre de posts par page

    // Vérifier s'il y a encore plus de posts à charger
    const totalPosts = await Post.countDocuments(); // Nombre total de posts
    const hasMore = totalPosts > page * limit; // Si le nombre total de posts est supérieur à la page * limit, il y a encore des posts à charger

    // Répondre avec les posts et la donnée `hasMore`
    res.json({
      posts,
      hasMore, // Ajouter cette donnée pour indiquer s'il reste des posts à charger
    });
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
