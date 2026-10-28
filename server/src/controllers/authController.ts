import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import sql from '../db'

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
