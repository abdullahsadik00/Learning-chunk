const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user');

const register = async (req, res) => {
    // Registration logic here
    try {
        const { fullName, email, password, role } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const user = new User({
            fullName,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        return res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Error registering user", error });
    }

};

const login = async (req, res) => {
    // Login logic here
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            'SECRET_KEY',
            { expiresIn: '84600' }
        );

        return res.status(200).json({
            message: "Login successful",
            token: token
        });
    } catch (error) {
        return res.status(500).json({ message: "Error logging in", error });
    }
};

module.exports = { register, login };