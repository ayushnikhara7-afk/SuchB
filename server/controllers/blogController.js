const Blog = require('../models/Blog');

// Create a new blog post
const createBlog = async (req, res) => {
  try {
    const { title, content, tags, category, featuredImage, status } = req.body;
    const author = req.user.id; // Assuming user is attached by auth middleware

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const blogData = {
      title,
      content, 
      author,
      tags: tags || [],
      category: category || 'General',
      featuredImage,
      status: status || 'draft'
    };

    const blog = new Blog(blogData);
    const result = await blog.save();

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: { _id: result.insertedId, ...blogData }
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post',
      error: error.message
    });
  }
};

// Get all blogs by author
const getBlogsByAuthor = async (req, res) => {
  try {
    const author = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const blogs = await Blog.findByAuthor(author);
    
    // Filter by status if provided
    let filteredBlogs = blogs;
    if (status) {
      filteredBlogs = blogs.filter(blog => blog.status === status);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedBlogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredBlogs.length / limit),
        totalBlogs: filteredBlogs.length
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
};

// Get published blogs (public)
const getPublishedBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag } = req.query;

    const blogs = await Blog.findPublished();
    
    // Filter by category if provided
    let filteredBlogs = blogs;
    if (category) {
      filteredBlogs = blogs.filter(blog => 
        blog.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by tag if provided
    if (tag) {
      filteredBlogs = filteredBlogs.filter(blog => 
        blog.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedBlogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredBlogs.length / limit),
        totalBlogs: filteredBlogs.length
      }
    });
  } catch (error) {
    console.error('Error fetching published blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
};

// Get blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog || !blog.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment view count
    await Blog.incrementViews(id);

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message
    });
  }
};

// Update blog
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const author = req.user.id;

    // Remove fields that shouldn't be updated directly
    delete updates.author;
    delete updates._id;
    delete updates.createdAt;
    delete updates.views;
    delete updates.likes;

    const result = await Blog.updateById(id, updates);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found or you do not have permission to update it'
      });
    }

    res.json({
      success: true,
      message: 'Blog updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
};

// Delete blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Blog.deleteById(id);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

module.exports = {
  createBlog,
  getBlogsByAuthor,
  getPublishedBlogs,
  getBlogById,
  updateBlog,
  deleteBlog
};
