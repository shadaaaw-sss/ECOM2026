import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware, requireAdmin, AuthRequest, getJwtSecret } from '../middleware/auth.js';
import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } from '../utils/email.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, verifyEmailSchema } from '../schemas/validation.js';

export const authRoutes = Router();

authRoutes.post('/register', validateBody(registerSchema), async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  try {
    const existingRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if ((existingRes.rowCount ?? 0) > 0) return res.status(409).json({ message: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await pool.query(
      'INSERT INTO users(id,email,password,role,first_name,last_name,is_email_verified,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,NOW())',
      [id, email, passwordHash, 'CLIENT', firstName || null, lastName || null, false]
    );

    try {
      const verifyToken = jwt.sign({ sub: id, type: 'email_verification' }, getJwtSecret(), { expiresIn: '1d' });
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      const link = `${frontend}/auth/verify?token=${verifyToken}`;
      await sendEmail(email, 'Verify your email', verificationEmailHtml(null, link));
    } catch (e) {
      console.warn('Failed to send verification email', e);
    }

    res.status(201).json({ message: 'Registered. Please check your email to verify your account.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

authRoutes.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT id,email,password,role,first_name,last_name FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name } });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

authRoutes.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { rows } = await pool.query('SELECT id,email,role,first_name,last_name,is_email_verified,created_at FROM users WHERE id = $1', [req.userId!]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name, isEmailVerified: user.is_email_verified, createdAt: user.created_at } });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch user' });
  }
});

authRoutes.patch('/me', authMiddleware, validateBody(updateProfileSchema), async (req: AuthRequest, res) => {
  const { password, firstName, lastName } = req.body;
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (password) { const ph = await bcrypt.hash(password, 10); fields.push(`password = $${idx++}`); values.push(ph); }
    if (firstName !== undefined) { fields.push(`first_name = $${idx++}`); values.push(firstName || null); }
    if (lastName !== undefined) { fields.push(`last_name = $${idx++}`); values.push(lastName || null); }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id,email,role,first_name,last_name`;
    values.push(req.userId!);
    const { rows } = await pool.query(sql, values);
    const user = rows[0];
    res.json({ user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name } });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
});

authRoutes.post('/forgot-password', validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (user) {
      try {
        const token = jwt.sign({ sub: user.id, type: 'password_reset' }, getJwtSecret(), { expiresIn: '1h' });
        const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
        const link = `${frontend}/auth/reset?token=${token}`;
        await sendEmail(email, 'Reset your password', resetPasswordEmailHtml(null, link));
      } catch (e) {
        console.warn('Failed to send reset email', e);
      }
    }
    res.json({ message: 'If the email exists, a password reset link has been sent.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Request failed' });
  }
});

authRoutes.get('/verify-email', validateQuery(verifyEmailSchema), async (req, res) => {
  const token = req.query.token as string | undefined;
  if (!token) return res.status(400).json({ message: 'Token is required' });
  try {
    const payload = jwt.verify(token, getJwtSecret()) as any;
    if (payload?.type !== 'email_verification') return res.status(400).json({ message: 'Invalid token' });
    await pool.query('UPDATE users SET is_email_verified = true WHERE id = $1', [payload.sub]);
    res.json({ message: 'Email verified' });
  } catch (e) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

authRoutes.post('/reset-password', validateBody(resetPasswordSchema), async (req, res) => {
  const { token, password } = req.body;
  try {
    const payload = jwt.verify(token, getJwtSecret()) as any;
    if (payload?.type !== 'password_reset') return res.status(400).json({ message: 'Invalid token' });
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [passwordHash, payload.sub]);
    res.json({ message: 'Password updated' });
  } catch (e) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});