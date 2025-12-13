import jwt from 'jsonwebtoken';  // Using `import`
import { User } from '../model/user.js';
// const User = require('../model/user');

const verifyToken = (req, res, next) => {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {

        jwt.verify(req.headers.authorization.split(' ')[1], 'SECRET_KEY', (err, decode) => {
            if (err) {
                req.user = undefined;
                next();
            } else {
                User.findById(decode.id).then(user => {
                    req.user = user;
                    next();
                }).catch(err => {
                    res.status(500).json({ hasError: true, message: "Error fetching user", error: err });
                });
            }
        });
    } else {
        req.user = undefined;
        req.message = "Authorization header not found";
        next();
    }
}

export default verifyToken;