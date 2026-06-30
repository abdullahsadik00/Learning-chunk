const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../config');
const authMiddleware = require('../middleware');

const signupSchema = zod.object({
    username: zod.string().email(),
    password: zod.string().min(8),
    firstName: zod.string().min(1),
    lastName: zod.string().min(1)
});

router.post('/signup', async (req, res) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: "Invalid inputs" });
    }

    const { username, password, firstName, lastName } = result.data;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
        return res.status(409).json({ message: "Email already taken" });
    }

    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const balance = (1000 + Math.random() * 9000).toFixed(2);

    const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: { username, passwordHash, firstName, lastName }
        });
        await tx.account.create({
            data: { userId: newUser.id, balance }
        });
        return newUser;
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    res.status(201).json({
        message: "User created successfully",
        token,
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username }
    });
});

const signinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string()
});

router.post('/signin', async (req, res) => {
    const result = signinSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: "Invalid inputs" });
    }

    const { username, password } = result.data;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    res.json({
        token,
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username }
    });
});

const updateSchema = zod.object({
    password: zod.string().min(8).optional(),
    firstName: zod.string().min(1).optional(),
    lastName: zod.string().min(1).optional()
});

router.put('/', authMiddleware, async (req, res) => {
    const result = updateSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: "Invalid inputs" });
    }

    const data = { ...result.data };
    if (data.password) {
        data.passwordHash = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
        delete data.password;
    }

    await prisma.user.update({ where: { id: req.userId }, data });
    res.json({ message: "Updated successfully" });
});

router.get('/bulk', authMiddleware, async (req, res) => {
    const filter = req.query.filter || "";

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { firstName: { contains: filter, mode: 'insensitive' } },
                { lastName: { contains: filter, mode: 'insensitive' } }
            ],
            NOT: { id: req.userId }
        },
        select: { id: true, username: true, firstName: true, lastName: true }
    });

    res.json({ users });
});

module.exports = router;
