const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');


function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(403).json({
                message: "Invalid token"
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(403).json({
            message: "Invalid token"
        });
    }
}

module.exports = authMiddleware;