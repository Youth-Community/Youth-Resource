import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';

export const createPodcast = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      seriesId,
      episodeNumber,
      audioFileUrl,
      duration,
      categoryId,
      tags,
      coverArtUrl,
      guests,
      showNotes,
      explicitContent = false
    } = req.body;

    if (!req.user || (req.user.role !== 'MANAGER' && req.user.role !== 'MASTERMIND')) {
      return res.status(403).json({
        success: false,
        error: 'Manager or Mastermind permission required to upload podcasts'
      });
    }

    await pool.query('BEGIN');

    const contentResult = await pool.query(
      `INSERT INTO content (title, description, content_type, author_id, category_id, tags, status)
       VALUES ($1, $2, 'podcast', $3, $4, $5, 'pending')
       RETURNING *`,
      [title, description, req.user.userId, categoryId, tags]
    );

    const content = contentResult.rows[0];

    const podcastResult = await pool.query(
      `INSERT INTO podcast_episodes (content_id, series_id, episode_number, audio_file_url, audio_duration,
                                    cover_art_url, guests, show_notes, explicit_content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [content.id, seriesId, episodeNumber, audioFileUrl, duration, coverArtUrl, guests, showNotes, explicitContent]
    );

    await pool.query('COMMIT');

    const podcast = {
      ...content,
      episode: podcastResult.rows[0]
    };

    res.status(201).json({
      success: true,
      data: podcast,
      message: 'Podcast episode created successfully and is pending approval'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Create podcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPodcasts = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      seriesId,
      sort = 'newest',
      featured
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE c.status = \'approved\'';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ` AND c.category_id = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (seriesId) {
      whereClause += ` AND pe.series_id = $${paramIndex}`;
      queryParams.push(seriesId);
      paramIndex++;
    }

    if (featured) {
      whereClause += ` AND c.is_featured = true`;
    }

    let orderClause = 'ORDER BY c.created_at DESC';
    switch (sort) {
      case 'popular':
        orderClause = 'ORDER BY pe.play_count DESC, c.view_count DESC';
        break;
      case 'episode_number':
        orderClause = 'ORDER BY pe.series_id, pe.episode_number DESC';
        break;
      case 'duration':
        orderClause = 'ORDER BY pe.audio_duration DESC';
        break;
    }

    const query = `
      SELECT c.*, pe.series_id, pe.episode_number, pe.audio_file_url, pe.audio_duration,
             pe.cover_art_url, pe.guests, pe.show_notes, pe.explicit_content,
             u.username as author_name, u.display_name as author_display_name,
             cat.name as category_name, cat.slug as category_slug
      FROM content c
      JOIN podcast_episodes pe ON c.id = pe.content_id
      JOIN users u ON c.author_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM content c
      JOIN podcast_episodes pe ON c.id = pe.content_id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        podcasts: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get podcasts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPodcastById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, pe.series_id, pe.episode_number, pe.audio_file_url, pe.audio_duration,
              pe.waveform_data, pe.transcript, pe.cover_art_url, pe.guests, pe.show_notes, pe.explicit_content,
              u.username as author_name, u.display_name as author_display_name, u.avatar_url as author_avatar,
              cat.name as category_name, cat.slug as category_slug
       FROM content c
       JOIN podcast_episodes pe ON c.id = pe.content_id
       JOIN users u ON c.author_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Podcast episode not found'
      });
    }

    const podcast = result.rows[0];

    await pool.query(
      'UPDATE podcast_episodes SET audio_duration = audio_duration + 1 WHERE content_id = $1',
      [id]
    );

    await pool.query(
      'UPDATE content SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      data: podcast
    });
  } catch (error) {
    console.error('Get podcast by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const playPodcast = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await pool.query(
      'UPDATE podcast_episodes SET play_count = COALESCE(play_count, 0) + 1 WHERE content_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Podcast episode not found'
      });
    }

    await pool.query(
      'INSERT INTO user_activities (user_id, activity_type, coins_earned, experience_earned, related_content_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, 'podcast_play', 1, 2, id]
    );

    res.json({
      success: true,
      message: 'Play count updated successfully'
    });
  } catch (error) {
    console.error('Play podcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const downloadPodcast = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await pool.query(
      `UPDATE podcast_episodes pe
       SET play_count = COALESCE(play_count, 0) + 1
       FROM content c
       WHERE pe.content_id = c.id AND pe.content_id = $1
       RETURNING pe.audio_file_url`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Podcast episode not found'
      });
    }

    await pool.query(
      'UPDATE content SET download_count = download_count + 1 WHERE id = $1',
      [id]
    );

    await pool.query(
      'INSERT INTO user_activities (user_id, activity_type, coins_earned, experience_earned, related_content_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, 'podcast_download', 3, 5, id]
    );

    res.json({
      success: true,
      data: {
        downloadUrl: result.rows[0].audio_file_url
      },
      message: 'Download count updated successfully'
    });
  } catch (error) {
    console.error('Download podcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPodcastCategories = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.name, c.slug, c.description, c.icon_url, c.color,
              COUNT(pe.content_id) as episode_count
       FROM categories c
       LEFT JOIN content cont ON c.id = cont.category_id AND cont.content_type = 'podcast' AND cont.status = 'approved'
       LEFT JOIN podcast_episodes pe ON cont.id = pe.content_id
       WHERE c.is_active = true
       GROUP BY c.id, c.name, c.slug, c.description, c.icon_url, c.color
       ORDER BY episode_count DESC, c.name ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get podcast categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};