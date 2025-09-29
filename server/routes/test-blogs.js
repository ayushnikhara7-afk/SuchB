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

// Test routes without authentication for development
router.post('/', (req, res) => {
  // Mock user for testing
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  createBlog(req, res);
});

router.get('/author/my-blogs', (req, res) => {
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  getBlogsByAuthor(req, res);
});

router.get('/published', (req, res) => {
  getPublishedBlogs(req, res);
});

router.get('/:id', (req, res) => {
  getBlogById(req, res);
});

router.put('/:id', (req, res) => {
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  updateBlog(req, res);
});

router.delete('/:id', (req, res) => {
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  deleteBlog(req, res);
});

module.exports = router;
