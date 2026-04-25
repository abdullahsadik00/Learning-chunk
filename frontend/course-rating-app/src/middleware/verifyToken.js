import jwt from 'jsonwebtoken';
import { User } from '../model/user.js';

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided
        req.user = null;
        return next(); // Let endpoint decide whether to return 401/403
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, 'SECRET_KEY');
        const user = await User.findById(decoded.id);

        if (!user) {
            req.user = null;
        } else {
            req.user = user;
        }

        next(); // Continue to route handler
    } catch (err) {
        req.user = null; // Token invalid
        next();
    }
};

export default verifyToken;