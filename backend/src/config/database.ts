import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'youth_resources',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;

export const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        bio TEXT,
        avatar_url VARCHAR(500),
        role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'MANAGER', 'MASTERMIND')),
        coins INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        experience_points INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES categories(id),
        icon_url VARCHAR(500),
        color VARCHAR(7),
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('article', 'book', 'course', 'idea', 'podcast')),
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
        author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id),
        content_data JSONB,
        thumbnail_url VARCHAR(500),
        file_size BIGINT,
        view_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        tags TEXT[],
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS podcast_episodes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID REFERENCES content(id) ON DELETE CASCADE,
        series_id UUID,
        episode_number INTEGER,
        audio_file_url VARCHAR(500) NOT NULL,
        audio_duration INTEGER,
        waveform_data JSONB,
        transcript TEXT,
        cover_art_url VARCHAR(500),
        guests JSONB,
        show_notes JSONB,
        explicit_content BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        activity_type VARCHAR(50) NOT NULL,
        related_content_id UUID REFERENCES content(id),
        coins_earned INTEGER DEFAULT 0,
        experience_earned INTEGER DEFAULT 0,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        badge_type VARCHAR(100) NOT NULL,
        badge_level INTEGER DEFAULT 1,
        earned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, badge_type)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS coin_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        amount INTEGER NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        related_user_id UUID REFERENCES users(id),
        related_content_id UUID REFERENCES content(id),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content TEXT NOT NULL,
        author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content_id UUID REFERENCES content(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'deleted')),
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_content_author ON content(author_id);
      CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
      CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
      CREATE INDEX IF NOT EXISTS idx_content_category ON content(category_id);
      CREATE INDEX IF NOT EXISTS idx_content_published ON content(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_content_search ON content USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
      CREATE INDEX IF NOT EXISTS idx_content_tags ON content USING gin(tags);
      CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activities_type ON user_activities(activity_type, created_at DESC);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};