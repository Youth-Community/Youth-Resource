import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const {
      q: query,
      page = 1,
      limit = 20,
      contentType,
      category,
      sort = 'relevance',
      rating,
      dateRange
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE c.status = \'approved\'';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (query && typeof query === 'string') {
      whereClause += ` AND (
        to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery('english', $${paramIndex})
        OR c.tags && ARRAY[$${paramIndex}]
      )`;
      queryParams.push(query);
      paramIndex++;
    }

    if (contentType && Array.isArray(contentType)) {
      whereClause += ` AND c.content_type = ANY($${paramIndex})`;
      queryParams.push(contentType);
      paramIndex++;
    }

    if (category && Array.isArray(category)) {
      whereClause += ` AND c.category_id = ANY($${paramIndex})`;
      queryParams.push(category);
      paramIndex++;
    }

    if (rating) {
      whereClause += ` AND c.rating >= $${paramIndex}`;
      queryParams.push(Number(rating));
      paramIndex++;
    }

    if (dateRange && typeof dateRange === 'string') {
      const now = new Date();
      let dateFilter = '';

      switch (dateRange) {
        case 'today':
          dateFilter = now.toISOString().split('T')[0];
          whereClause += ` AND DATE(c.created_at) = $${paramIndex}`;
          queryParams.push(dateFilter);
          break;
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          whereClause += ` AND c.created_at >= $${paramIndex}`;
          queryParams.push(dateFilter.toISOString());
          break;
        case 'month':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          whereClause += ` AND c.created_at >= $${paramIndex}`;
          queryParams.push(dateFilter.toISOString());
          break;
        case 'year':
          dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          whereClause += ` AND c.created_at >= $${paramIndex}`;
          queryParams.push(dateFilter.toISOString());
          break;
      }
      paramIndex++;
    }

    let orderClause = 'ORDER BY ';
    if (query && sort === 'relevance') {
      orderClause += `ts_rank(to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')), plainto_tsquery('english', $1)) DESC, c.created_at DESC`;
    } else {
      switch (sort) {
        case 'popular':
          orderClause += 'c.view_count DESC, c.rating DESC';
          break;
        case 'highest_rated':
          orderClause += 'c.rating DESC, c.rating_count DESC';
          break;
        case 'oldest':
          orderClause += 'c.created_at ASC';
          break;
        default:
          orderClause += 'c.created_at DESC';
      }
    }

    const searchQuery = `
      SELECT c.*, u.username as author_name, u.display_name as author_display_name,
             cat.name as category_name, cat.slug as category_slug
      FROM content c
      JOIN users u ON c.author_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);
    paramIndex += 2;

    const contentResult = await pool.query(searchQuery, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total FROM content c
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].total);

    const facetsQuery = `
      SELECT
        c.content_type,
        COUNT(*) as count
      FROM content c
      ${whereClause}
      GROUP BY c.content_type
    `;

    const facetsResult = await pool.query(facetsQuery, queryParams.slice(0, -2));
    const typeFacets = facetsResult.rows.reduce((acc: any, row) => {
      acc[row.content_type] = parseInt(row.count);
      return acc;
    }, {});

    const suggestions = [];
    if (query && typeof query === 'string') {
      const suggestionsQuery = `
        SELECT DISTINCT tags, title
        FROM content
        WHERE status = 'approved'
          AND (title % $1 OR tags && ARRAY[$1])
        ORDER BY similarity(title, $1) DESC
        LIMIT 5
      `;
      const suggestionsResult = await pool.query(suggestionsQuery, [query]);

      suggestionsResult.rows.forEach(row => {
        if (row.tags && Array.isArray(row.tags)) {
          row.tags.forEach((tag: string) => {
            if (tag.toLowerCase().includes(query.toLowerCase()) && suggestions.length < 5) {
              suggestions.push(tag);
            }
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        results: contentResult.rows,
        totalCount,
        suggestions: suggestions.slice(0, 5),
        facets: {
          types: typeFacets
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getSearchSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { q: query } = req.query;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const suggestionsQuery = `
      (SELECT DISTINCT title as suggestion, 'content' as type
       FROM content
       WHERE status = 'approved' AND title % $1
       ORDER BY similarity(title, $1) DESC
       LIMIT 3)
      UNION
      (SELECT DISTINCT unnest(tags) as suggestion, 'tag' as type
       FROM content
       WHERE status = 'approved' AND tags && ARRAY[$1]
       LIMIT 3)
      UNION
      (SELECT DISTINCT name as suggestion, 'category' as type
       FROM categories
       WHERE name % $1 AND is_active = true
       ORDER BY similarity(name, $1) DESC
       LIMIT 2)
      LIMIT 8
    `;

    const result = await pool.query(suggestionsQuery, [query]);

    res.json({
      success: true,
      data: {
        suggestions: result.rows
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getTrendingContent = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10, contentType, timeframe = 'week' } = req.query;

    let dateFilter = '';
    const now = new Date();
    const queryParams: any[] = [];

    switch (timeframe) {
      case 'today':
        dateFilter = 'AND DATE(c.created_at) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND c.created_at >= $1';
        queryParams.push(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        dateFilter = 'AND c.created_at >= $1';
        queryParams.push(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        break;
    }

    let whereClause = 'WHERE c.status = \'approved\'';
    if (contentType) {
      whereClause += ` AND c.content_type = $${queryParams.length + 1}`;
      queryParams.push(contentType);
    }
    whereClause += ' ' + dateFilter;

    const trendingQuery = `
      SELECT c.*, u.username as author_name, u.display_name as author_display_name,
             cat.name as category_name, cat.slug as category_slug,
             (c.view_count * 0.3 + c.download_count * 0.2 + c.rating * c.rating_count * 0.5) as trending_score
      FROM content c
      JOIN users u ON c.author_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
      ORDER BY trending_score DESC, c.created_at DESC
      LIMIT $${queryParams.length + 1}
    `;

    queryParams.push(Number(limit));

    const result = await pool.query(trendingQuery, queryParams);

    res.json({
      success: true,
      data: {
        trending: result.rows
      }
    });
  } catch (error) {
    console.error('Get trending content error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};