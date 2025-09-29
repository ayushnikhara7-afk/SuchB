const express = require('express');
const router = express.Router();
const {
  createBlog,
  getBlogsByAuthor,
  getPublishedBlogs,
  getBlogById,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');
const authenticateToken = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/published', getPublishedBlogs);
router.get('/:id', getBlogById);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/', createBlog);
router.get('/author/my-blogs', getBlogsByAuthor);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;
