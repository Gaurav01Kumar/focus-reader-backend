import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ensureAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.app_auth_token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default ensureAuth;