/**
 * Security Utilities for Task-Marshal
 * BuildWorks.AI - Security, authentication, and authorization
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { 
  User, 
  Session, 
  AuthenticationError,
  AuthorizationError,
  TaskMarshalConfig 
} from '../types/index.js';

/**
 * Security utility class for Task-Marshal
 */
 
export class SecurityUtils {
  private config: TaskMarshalConfig;
  private jwtSecret: string;

  constructor(config: TaskMarshalConfig) {
    this.config = config;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(user: User, expiresIn: number = 86400): string {
    const payload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions.map(p => p.name),
    };

    const options: jwt.SignOptions = {
      expiresIn,
      issuer: 'task-marshal',
      audience: 'task-marshal-client',
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string; tenantId: string; roles: string[]; permissions: string[] } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'task-marshal',
        audience: 'task-marshal-client',
      }) as any;

      return {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
      };
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Create user session
   */
  createSession(user: User, expiresIn: number = 24 * 60 * 60 * 1000): Session {
    return {
      id: this.generateUUID(),
      userId: user.id,
      tenantId: user.tenantId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresIn),
      metadata: {
        userAgent: 'task-marshal-client',
        ipAddress: '127.0.0.1', // TODO: Get from request
      },
    };
  }

  /**
   * Validate session
   */
  validateSession(session: Session): boolean {
    return session.expiresAt > new Date();
  }

  /**
   * Check if user has permission
   */
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Check if user has role
   */
  hasRole(userRoles: string[], requiredRole: string): boolean {
    return userRoles.includes(requiredRole);
  }

  /**
   * Check if user has any of the required roles
   */
  hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Authorize user action
   */
  authorize(
    userPermissions: string[],
    userRoles: string[],
    userTenantId: string,
    resourceTenantId: string,
    requiredPermissions: string[] = [],
    requiredRoles: string[] = [],
    allowCrossTenant: boolean = false
  ): void {
    // Check tenant isolation
    if (this.config.security.tenantIsolation.enabled && !allowCrossTenant) {
      if (userTenantId !== resourceTenantId) {
        throw new AuthorizationError('Access denied: Resource belongs to different tenant');
      }
    }

    // Check roles
    if (requiredRoles.length > 0) {
      if (!this.hasAnyRole(userRoles, requiredRoles)) {
        throw new AuthorizationError(`Access denied: Required roles: ${requiredRoles.join(', ')}`);
      }
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      if (!this.hasAllPermissions(userPermissions, requiredPermissions)) {
        throw new AuthorizationError(`Access denied: Required permissions: ${requiredPermissions.join(', ')}`);
      }
    }
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .trim();
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken;
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Generate UUID v4
   */
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number,
    requestCounts: Map<string, { count: number; resetTime: number }>
  ): boolean {
    const now = Date.now();
    
    // Clean up expired entries
    for (const [_key, value] of requestCounts.entries()) {
      if (value.resetTime < now) {
        requestCounts.delete(_key);
      }
    }
    
    const current = requestCounts.get(identifier);
    
    if (!current) {
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }
    
    if (current.count >= maxRequests) {
      return false;
    }
    
    current.count++;
    return true;
  }

  /**
   * Validate API key
   */
  validateAPIKey(apiKey: string, validKeys: string[]): boolean {
    return validKeys.includes(apiKey);
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string, _key: string): string {
    // TODO: Implement proper encryption
    // For now, return base64 encoded data
    return Buffer.from(data).toString('base64');
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string, _key: string): string {
    // TODO: Implement proper decryption
    // For now, return base64 decoded data
    return Buffer.from(encryptedData, 'base64').toString('utf-8');
  }

  /**
   * Generate secure hash for data integrity
   */
  generateHash(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity
   */
  verifyHash(data: string, hash: string): boolean {
    return this.generateHash(data) === hash;
  }

  /**
   * Get default permissions for role
   */
  getDefaultPermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'task:create',
        'task:read',
        'task:update',
        'task:delete',
        'project:create',
        'project:read',
        'project:update',
        'project:delete',
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'audit:read',
      ],
      manager: [
        'task:create',
        'task:read',
        'task:update',
        'project:create',
        'project:read',
        'project:update',
        'user:read',
      ],
      developer: [
        'task:create',
        'task:read',
        'task:update',
        'project:read',
      ],
      viewer: [
        'task:read',
        'project:read',
      ],
    };

    return rolePermissions[role] || [];
  }

  /**
   * Check if action is allowed for resource
   */
  isActionAllowed(
    action: string,
    resource: string,
    userPermissions: string[]
  ): boolean {
    const permission = `${resource}:${action}`;
    return userPermissions.includes(permission);
  }
}
