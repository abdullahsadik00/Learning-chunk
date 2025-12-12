const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user');

const register = (req, res) => {
    // Registration logic here
    try {
        const user = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            role: req.body.role
        });
        user.save().then(() => {
            return res.status(201).json({ message: "User registered successfully" });
        }).catch(err => {
            return res.status(500).json({ message: "Error registering user", error: err });
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error });
    }
};

const login = () => { };

module.exports = { register, login };