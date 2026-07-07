import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } from '../utils/email.js';

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, isEmailVerified: false },
  });

  // send verification email
  try {
    const verifyToken = jwt.sign({ sub: user.id, type: 'email_verification' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1d' });
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontend}/auth/verify?token=${verifyToken}`;
    await sendEmail(email, 'Verify your email', verificationEmailHtml(firstName || null, link));
  } catch (e) {
    console.warn('Failed to send verification email', e);
  }

  res.status(201).json({ message: 'Registered. Please check your email to verify your account.' });
});

authRoutes.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

authRoutes.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

authRoutes.patch('/me', authMiddleware, async (req: AuthRequest, res) => {
  const { firstName, lastName, password } = req.body as { firstName?: string; lastName?: string; password?: string };
  const data: Record<string, unknown> = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data,
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });
  res.json({ user });
});

authRoutes.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    try {
      const token = jwt.sign({ sub: user.id, type: 'password_reset' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      const link = `${frontend}/auth/reset?token=${token}`;
      await sendEmail(email, 'Reset your password', resetPasswordEmailHtml(user.firstName || null, link));
    } catch (e) {
      console.warn('Failed to send reset email', e);
    }
  }
  res.json({ message: 'If the email exists, a password reset link has been sent.' });
});

authRoutes.get('/verify-email', async (req, res) => {
  const token = req.query.token as string | undefined;
  if (!token) return res.status(400).json({ message: 'Token is required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    if (payload?.type !== 'email_verification') return res.status(400).json({ message: 'Invalid token' });
    await prisma.user.update({ where: { id: payload.sub }, data: { isEmailVerified: true } });
    res.json({ message: 'Email verified' });
  } catch (e) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

authRoutes.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    if (payload?.type !== 'password_reset') return res.status(400).json({ message: 'Invalid token' });
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: payload.sub }, data: { passwordHash } });
    res.json({ message: 'Password updated' });
  } catch (e) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});
