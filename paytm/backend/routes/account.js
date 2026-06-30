const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware');
const zod = require('zod');

router.get('/balance', authMiddleware, async (req, res) => {
    const account = await prisma.account.findUnique({ where: { userId: req.userId } });
    if (!account) {
        return res.status(404).json({ message: "Account not found" });
    }
    res.json({ balance: account.balance.toString() });
});

const transferSchema = zod.object({
    to: zod.string().min(1),
    amount: zod.number().positive(),
    note: zod.string().max(100).optional()
});

router.post('/transfer', authMiddleware, async (req, res) => {
    const result = transferSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: "Invalid inputs" });
    }

    const { to, amount, note } = result.data;

    if (to === req.userId) {
        return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    const toUser = await prisma.user.findUnique({ where: { id: to } });
    if (!toUser) {
        return res.status(400).json({ message: "Recipient not found" });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const senderAccount = await tx.account.findUnique({ where: { userId: req.userId } });
            if (!senderAccount || Number(senderAccount.balance) < amount) {
                throw new Error("INSUFFICIENT_BALANCE");
            }

            await tx.account.update({
                where: { userId: req.userId },
                data: { balance: { decrement: amount } }
            });

            await tx.account.update({
                where: { userId: to },
                data: { balance: { increment: amount } }
            });

            await tx.transaction.create({
                data: { senderId: req.userId, receiverId: to, amount, note: note || null }
            });
        });

        res.json({ message: "Transfer successful" });
    } catch (err) {
        if (err.message === "INSUFFICIENT_BALANCE") {
            return res.status(400).json({ message: "Insufficient balance" });
        }
        res.status(500).json({ message: "Transfer failed" });
    }
});

router.get('/transactions', authMiddleware, async (req, res) => {
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [{ senderId: req.userId }, { receiverId: req.userId }]
        },
        include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
            receiver: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const result = transactions.map(txn => ({
        id: txn.id,
        amount: txn.amount.toString(),
        note: txn.note,
        createdAt: txn.createdAt,
        type: txn.senderId === req.userId ? 'sent' : 'received',
        sender: txn.sender,
        receiver: txn.receiver
    }));

    res.json({ transactions: result });
});

module.exports = router;
