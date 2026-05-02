const express = require('express');
const router = express.Router();
const { User, Account } = require('../db');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const authMiddleware = require('../middleware');

const userSchema = zod.object({
    username: zod.string().email(),
    password: zod.string().min(6),
    firstName: zod.string(),
    lastName: zod.string()
});

router.post('/signup', async (req, res) => {
    const { success } = userSchema.safeParse(req.body);
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        });
    }
    const { username, password, firstName, lastName } = req.body;
    const existingUser = await User.findOne({ username });

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs",
        });
    }

    const user = await User.create({
        username,
        password,
        firstName,
        lastName
    });

    const userId = user._id;

    await Account.create({
        userID: userId,
        balance: 1 + Math.random() * 10000
    });

    const token = jwt.sign({ userId }, JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token
    });
});

const userSignin = zod.object({
    username: zod.string().email(),
    password: zod.string()
});

router.post('/signin', async (req, res) => {
    const { success } = userSignin.safeParse(req.body);
    if (!success) {
        return res.status(411).json({
            message: "Error while logging in"
        });
    }
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (user) {
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        return res.json({
            token
        });
    }

    res.status(411).json({
        message: "Error while logging in"
    });
});

router.put('/', authMiddleware, async function (req, res) {
    const updateBody = zod.object({
        password: zod.string().optional(),
        firstName: zod.string().optional(),
        lastName: zod.string().optional()
    });

    const { success } = updateBody.safeParse(req.body);
    if (!success) {
        return res.status(411).json({
            message: "Error while updating information"
        });
    }

    await User.updateOne({ _id: req.userId }, req.body);
    res.json({
        message: "Updated successfully"
    });
});

router.get('/bulk', async (req, res) => {
    const filter = req.query.filter || "";
    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter,
                "$options": "i"
            }
        },
        {
            lastName: {
                "$regex": filter,
                "$options": "i"
            }
        }
        ]
    });

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    });
});

module.exports = router;
