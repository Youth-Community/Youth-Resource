export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  role: 'USER' | 'MANAGER' | 'MASTERMIND';
  coins: number;
  level: number;
  experience_points: number;
  is_verified: boolean;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Content {
  id: string;
  title: string;
  description?: string;
  content_type: 'article' | 'book' | 'course' | 'idea' | 'podcast';
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  author_id: string;
  category_id?: string;
  content_data: Record<string, any>;
  thumbnail_url?: string;
  file_size?: number;
  view_count: number;
  download_count: number;
  rating: number;
  rating_count: number;
  is_featured: boolean;
  tags: string[];
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  icon_url?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
}

export interface PodcastEpisode {
  id: string;
  content_id: string;
  series_id?: string;
  episode_number?: number;
  audio_file_url: string;
  audio_duration?: number;
  waveform_data?: Record<string, any>;
  transcript?: string;
  cover_art_url?: string;
  guests?: Array<Record<string, any>>;
  show_notes?: Array<Record<string, any>>;
  explicit_content: boolean;
  created_at: Date;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  related_content_id?: string;
  coins_earned: number;
  experience_earned: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_level: number;
  earned_at: Date;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  related_user_id?: string;
  related_content_id?: string;
  description?: string;
  created_at: Date;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  content_id: string;
  parent_id?: string;
  status: 'published' | 'hidden' | 'deleted';
  like_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchFilters {
  content_type?: string[];
  category?: string[];
  date_range?: string;
  sort?: 'relevance' | 'newest' | 'oldest' | 'popular' | 'highest_rated';
  rating?: number;
}

export interface SearchResult {
  results: Content[];
  totalCount: number;
  suggestions: string[];
  facets: Record<string, Record<string, number>>;
  pagination: {
    page: number;
    totalPages: number;
  };
}