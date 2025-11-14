import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = '15m';
const JWT_REFRESH_EXPIRES_IN = '7d';

export const generateTokens = (payload: JWTPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateSecureToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};