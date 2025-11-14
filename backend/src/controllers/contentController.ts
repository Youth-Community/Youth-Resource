import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

export const createContent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, contentType, categoryId, tags, contentData } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await pool.query(
      `INSERT INTO content (title, description, content_type, author_id, category_id, tags, content_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [title, description, contentType, req.user.userId, categoryId, tags, contentData]
    );

    const content = result.rows[0];

    await pool.query(
      'INSERT INTO user_activities (user_id, activity_type, coins_earned, experience_earned, related_content_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, 'content_upload', 25, 50, content.id]
    );

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getContentList = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      contentType,
      category,
      status = 'approved',
      sort = 'newest',
      featured
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE c.status = $1';
    const queryParams: any[] = [status];
    let paramIndex = 2;

    if (contentType) {
      whereClause += ` AND c.content_type = $${paramIndex}`;
      queryParams.push(contentType);
      paramIndex++;
    }

    if (category) {
      whereClause += ` AND c.category_id = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (featured) {
      whereClause += ` AND c.is_featured = true`;
    }

    let orderClause = 'ORDER BY c.created_at DESC';
    switch (sort) {
      case 'popular':
        orderClause = 'ORDER BY c.view_count DESC';
        break;
      case 'highest_rated':
        orderClause = 'ORDER BY c.rating DESC, c.rating_count DESC';
        break;
      case 'oldest':
        orderClause = 'ORDER BY c.created_at ASC';
        break;
    }

    const contentResult = await pool.query(
      `SELECT c.*, u.username as author_name, u.display_name as author_display_name,
              cat.name as category_name, cat.slug as category_slug
       FROM content c
       JOIN users u ON c.author_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       ${whereClause}
       ${orderClause}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, Number(limit), offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM content c ${whereClause}`,
      queryParams
    );

    const totalCount = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        content: contentResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get content list error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getContentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, u.username as author_name, u.display_name as author_display_name, u.avatar_url as author_avatar,
              cat.name as category_name, cat.slug as category_slug
       FROM content c
       JOIN users u ON c.author_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    const content = result.rows[0];

    await pool.query(
      'UPDATE content SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, tags, contentData } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const contentResult = await pool.query(
      'SELECT author_id, status FROM content WHERE id = $1',
      [id]
    );

    if (contentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    const content = contentResult.rows[0];

    const isAuthor = content.author_id === req.user.userId;
    const isManager = req.user.role === 'MANAGER' || req.user.role === 'MASTERMIND';

    if (!isAuthor && !isManager) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    const updateResult = await pool.query(
      `UPDATE content
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           tags = COALESCE($3, tags),
           content_data = COALESCE($4, content_data),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, tags, contentData, id]
    );

    res.json({
      success: true,
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const contentResult = await pool.query(
      'SELECT author_id FROM content WHERE id = $1',
      [id]
    );

    if (contentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    const content = contentResult.rows[0];

    const isAuthor = content.author_id === req.user.userId;
    const isMastermind = req.user.role === 'MASTERMIND';

    if (!isAuthor && !isMastermind) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    await pool.query('DELETE FROM content WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const approveContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user || (req.user.role !== 'MANAGER' && req.user.role !== 'MASTERMIND')) {
      return res.status(403).json({
        success: false,
        error: 'Manager or Mastermind permission required'
      });
    }

    const result = await pool.query(
      `UPDATE content
       SET status = 'approved', published_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found or not in pending status'
      });
    }

    const content = result.rows[0];

    let coinsEarned = 0;
    let experienceEarned = 0;

    switch (content.content_type) {
      case 'article':
        coinsEarned = 100;
        experienceEarned = 200;
        break;
      case 'book':
        coinsEarned = 150;
        experienceEarned = 300;
        break;
      case 'idea':
        coinsEarned = 25;
        experienceEarned = 50;
        break;
      case 'course':
        coinsEarned = 200;
        experienceEarned = 400;
        break;
      case 'podcast':
        coinsEarned = 120;
        experienceEarned = 250;
        break;
    }

    await pool.query(
      'INSERT INTO user_activities (user_id, activity_type, coins_earned, experience_earned, related_content_id) VALUES ($1, $2, $3, $4, $5)',
      [content.author_id, 'content_approved', coinsEarned, experienceEarned, content.id]
    );

    await pool.query(
      'UPDATE users SET coins = coins + $1, experience_points = experience_points + $2 WHERE id = $3',
      [coinsEarned, experienceEarned, content.author_id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Content approved successfully'
    });
  } catch (error) {
    console.error('Approve content error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const rejectContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.user || (req.user.role !== 'MANAGER' && req.user.role !== 'MASTERMIND')) {
      return res.status(403).json({
        success: false,
        error: 'Manager or Mastermind permission required'
      });
    }

    const result = await pool.query(
      `UPDATE content
       SET status = 'rejected', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found or not in pending status'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Content rejected successfully'
    });
  } catch (error) {
    console.error('Reject content error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};