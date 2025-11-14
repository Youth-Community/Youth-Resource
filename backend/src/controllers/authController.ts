import { Request, Response } from 'express';
import pool from '../config/database';
import redis from '../config/redis';
import { generateTokens, verifyRefreshToken, hashPassword, comparePassword } from '../utils/auth';
import { AuthRequest, ApiResponse } from '../types';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, displayName, bio } = req.body;

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, bio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, display_name, role, coins, level, experience_points, is_verified, created_at`,
      [username, email, passwordHash, displayName || username, bio]
    );

    const user = result.rows[0];

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    await pool.query(
      'INSERT INTO user_activities (user_id, activity_type, coins_earned, experience_earned) VALUES ($1, $2, $3, $4)',
      [user.id, 'registration', 50, 100]
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          coins: user.coins,
          level: user.level,
          experiencePoints: user.experience_points,
          isVerified: user.is_verified,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    const result = await pool.query(
      'SELECT id, username, email, password_hash, display_name, role, coins, level, experience_points, is_verified, is_active FROM users WHERE username = $1 OR email = $1',
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    await pool.query(
      'INSERT INTO user_activities (user_id, activity_type, coins_earned, experience_earned) VALUES ($1, $2, $3, $4)',
      [user.id, 'login', 10, 5]
    );

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          coins: user.coins,
          level: user.level,
          experiencePoints: user.experience_points,
          isVerified: user.is_verified,
        },
        accessToken,
        refreshToken,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (!storedToken || storedToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    const userResult = await pool.query(
      'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(403).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const user = userResult.rows[0];

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

    await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, newRefreshToken);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await redis.del(`refresh_token:${req.user.userId}`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await pool.query(
      `SELECT id, username, email, display_name, bio, avatar_url, role, coins, level,
              experience_points, is_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        role: user.role,
        coins: user.coins,
        level: user.level,
        experiencePoints: user.experience_points,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};