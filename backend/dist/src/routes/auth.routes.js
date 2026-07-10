import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } from '../utils/email.js';
export const authRoutes = Router();
authRoutes.post('/register', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required' });
    try {
        const existingRes = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
        if ((existingRes.rowCount ?? 0) > 0)
            return res.status(409).json({ message: 'User already exists' });
        const passwordHash = await bcrypt.hash(password, 10);
        const id = require('uuid').v4();
        await pool.query('INSERT INTO "user"(id,email,password,role,is_email_verified,created_at) VALUES($1,$2,$3,$4,$5,NOW())', [id, email, passwordHash, 'USER', false]);
        // send verification email
        try {
            const verifyToken = jwt.sign({ sub: id, type: 'email_verification' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1d' });
            const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
            const link = `${frontend}/auth/verify?token=${verifyToken}`;
            await sendEmail(email, 'Verify your email', verificationEmailHtml(firstName || null, link));
        }
        catch (e) {
            console.warn('Failed to send verification email', e);
        }
        res.status(201).json({ message: 'Registered. Please check your email to verify your account.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
});
authRoutes.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT id,email,password,role FROM "user" WHERE email = $1', [email]);
        const user = rows[0];
        if (!user)
            return res.status(401).json({ message: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Login failed' });
    }
});
authRoutes.get('/me', authMiddleware, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id,email,role FROM "user" WHERE id = $1', [req.userId]);
        const user = rows[0];
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch user' });
    }
});
authRoutes.patch('/me', authMiddleware, async (req, res) => {
    const { firstName, lastName, password } = req.body;
    try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (firstName !== undefined) {
            fields.push(`first_name = $${idx++}`);
            values.push(firstName);
        }
        if (lastName !== undefined) {
            fields.push(`last_name = $${idx++}`);
            values.push(lastName);
        }
        if (password) {
            const ph = await bcrypt.hash(password, 10);
            fields.push(`password = $${idx++}`);
            values.push(ph);
        }
        if (fields.length === 0)
            return res.status(400).json({ message: 'No fields to update' });
        const sql = `UPDATE "user" SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id,email,role`;
        values.push(req.userId);
        const { rows } = await pool.query(sql, values);
        res.json({ user: rows[0] });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update user' });
    }
});
authRoutes.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: 'Email is required' });
    try {
        const { rows } = await pool.query('SELECT id,first_name FROM "user" WHERE email = $1', [email]);
        const user = rows[0];
        if (user) {
            try {
                const token = jwt.sign({ sub: user.id, type: 'password_reset' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });
                const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
                const link = `${frontend}/auth/reset?token=${token}`;
                await sendEmail(email, 'Reset your password', resetPasswordEmailHtml(user.first_name || null, link));
            }
            catch (e) {
                console.warn('Failed to send reset email', e);
            }
        }
        res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Request failed' });
    }
});
authRoutes.get('/verify-email', async (req, res) => {
    const token = req.query.token;
    if (!token)
        return res.status(400).json({ message: 'Token is required' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        if (payload?.type !== 'email_verification')
            return res.status(400).json({ message: 'Invalid token' });
        await pool.query('UPDATE "user" SET is_email_verified = true WHERE id = $1', [payload.sub]);
        res.json({ message: 'Email verified' });
    }
    catch (e) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});
authRoutes.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password)
        return res.status(400).json({ message: 'Token and password are required' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        if (payload?.type !== 'password_reset')
            return res.status(400).json({ message: 'Invalid token' });
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE "user" SET password = $1 WHERE id = $2', [passwordHash, payload.sub]);
        res.json({ message: 'Password updated' });
    }
    catch (e) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});
