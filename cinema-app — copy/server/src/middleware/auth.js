import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function authRequired(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'No token' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
