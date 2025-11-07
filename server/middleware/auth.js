import { auth } from '../config/firebase.js';
import jwt from 'jsonwebtoken';

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    const user = await auth.getUser(req.userId);
    const customClaims = user.customClaims || {};
    
    if (customClaims.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(403).json({ error: 'Unauthorized' });
  }
};

export const generateJWT = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};
