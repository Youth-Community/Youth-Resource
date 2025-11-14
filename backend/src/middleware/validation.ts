import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('displayName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Display name cannot exceed 100 characters'),

  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
];

export const validateLogin = [
  body('login')
    .notEmpty()
    .withMessage('Username or email required'),

  body('password')
    .notEmpty()
    .withMessage('Password required'),
];

export const validateContent = [
  body('title')
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),

  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('contentType')
    .isIn(['article', 'book', 'course', 'idea', 'podcast'])
    .withMessage('Invalid content type'),

  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          throw new Error('Each tag must be a string with max 50 characters');
        }
      }
      return true;
    }),
];

export const validateComment = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),

  body('contentId')
    .isUUID()
    .withMessage('Invalid content ID'),

  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Invalid parent comment ID'),
];

export const validateSearch = [
  body('query')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  body('contentType')
    .optional()
    .isArray()
    .withMessage('Content type must be an array'),

  body('category')
    .optional()
    .isArray()
    .withMessage('Category must be an array'),

  body('sort')
    .optional()
    .isIn(['relevance', 'newest', 'oldest', 'popular', 'highest_rated'])
    .withMessage('Invalid sort option'),
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
      })),
    });
  }
  next();
};