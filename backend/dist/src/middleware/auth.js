import jwt from 'jsonwebtoken';
export const getUserRoleFromHeader = (req) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token)
        return null;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        return payload.role ?? null;
    }
    catch {
        return null;
    }
};
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        req.userId = payload.sub;
        req.userRole = payload.role;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};
export const requireAdmin = (req, res, next) => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPERADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};
