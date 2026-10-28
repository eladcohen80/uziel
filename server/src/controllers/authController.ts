import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import sql from '../db'
import { sendPasswordResetEmail } from '../utils/email'

function signToken(user: { user_id: number; email: string; role: string }) {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET is not set')
    }
    return jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, secret, { expiresIn: '7d' })
}

export const register = async (req: Request, res: Response) => {
    const { user_name, email, password, teacher_id } = req.body
    if (!user_name || !email || !password || !teacher_id) {
        return res.status(400).json({ error: 'כל השדות חובה, כולל בחירת מורה' })
    }
    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' })
    }
    try {
        const existing = await sql`SELECT user_id FROM users WHERE email = ${email}`
        if (existing.length > 0) {
            return res.status(409).json({ error: 'האימייל כבר רשום' })
        }
        const teacher = await sql`SELECT id, position FROM teachers WHERE id = ${teacher_id} AND user_id IS NULL`
        if (teacher.length === 0) {
            return res.status(409).json({ error: 'המורה לא קיים או שכבר שויך למשתמש' })
        }
        // בעלת תפקיד (מנהלת/יועצת) מקבלת הרשאות אדמין כדי לראות את כל הכיתות
        const role = teacher[0].position ? 'admin' : 'user'
        const passwordHash = await bcrypt.hash(password, 10)
        const rows = await sql`
            INSERT INTO users (user_name, email, password, role)
            VALUES (${user_name}, ${email}, ${passwordHash}, ${role})
            RETURNING user_id, user_name, email, role
        `
        const user = rows[0]
        // השיוך מותנה ב-user_id IS NULL כדי למנוע שני משתמשים על אותו מורה
        const linked = await sql`
            UPDATE teachers SET user_id = ${user.user_id}
            WHERE id = ${teacher_id} AND user_id IS NULL
            RETURNING id
        `
        if (linked.length === 0) {
            await sql`DELETE FROM users WHERE user_id = ${user.user_id}`
            return res.status(409).json({ error: 'המורה כבר שויך למשתמש' })
        }
        res.status(201).json({ token: signToken(user as any), user })
    } catch (error) {
        res.status(500).json({ error: 'Failed to register' })
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body
    if (!email) {
        return res.status(400).json({ error: 'אימייל חובה' })
    }
    try {
        const users = await sql`SELECT user_id FROM users WHERE email = ${email}`
        // לא חושפים אם האימייל רשום במערכת
        if (users.length > 0) {
            const token = crypto.randomBytes(32).toString('hex')
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
            await sql`
                INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
                VALUES (${users[0].user_id}, ${tokenHash}, now() + interval '1 hour')
                ON CONFLICT (user_id) DO UPDATE
                SET token_hash = ${tokenHash}, expires_at = now() + interval '1 hour'
            `
            const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`
            await sendPasswordResetEmail(email, resetUrl)
        }
        res.json({ message: 'אם האימייל רשום במערכת, נשלח אליו קישור לאיפוס סיסמה' })
    } catch (error) {
        console.error('forgot-password failed:', error)
        res.status(500).json({ error: 'Failed to process request' })
    }
}

export const resetPassword = async (req: Request, res: Response) => {
    const { token, password } = req.body
    if (!token || !password) {
        return res.status(400).json({ error: 'כל השדות חובה' })
    }
    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' })
    }
    try {
        await sql`DELETE FROM password_reset_tokens WHERE expires_at <= now()`
        const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex')
        // מחיקת הטוקן בשאילתה אחת - כל טוקן תקף לשימוש חד-פעמי
        const rows = await sql`
            DELETE FROM password_reset_tokens
            WHERE token_hash = ${tokenHash}
            RETURNING user_id
        `
        if (rows.length === 0) {
            return res.status(400).json({ error: 'הקישור לא תקין או שפג תוקפו' })
        }
        const passwordHash = await bcrypt.hash(password, 10)
        await sql`UPDATE users SET password = ${passwordHash} WHERE user_id = ${rows[0].user_id}`
        res.json({ message: 'הסיסמה עודכנה בהצלחה' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' })
    }
}

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ error: 'אימייל וסיסמה חובה' })
    }
    try {
        const rows = await sql`SELECT * FROM users WHERE email = ${email}`
        const found = rows[0]
        if (!found || !(await bcrypt.compare(password, found.password))) {
            return res.status(401).json({ error: 'אימייל או סיסמה שגויים' })
        }
        const user = { user_id: found.user_id, user_name: found.user_name, email: found.email, role: found.role }
        res.json({ token: signToken(user), user })
    } catch (error) {
        res.status(500).json({ error: 'Failed to login' })
    }
}
