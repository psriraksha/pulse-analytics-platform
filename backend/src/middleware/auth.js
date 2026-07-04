import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    let token = header.startsWith('Bearer ') ? header.slice(7) : null;

    // Allow token via query string for direct-link downloads (e.g. PDF export opened in a new tab)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const company = await Company.findById(decoded.companyId).select('-password');

    if (!company) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.company = company;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
