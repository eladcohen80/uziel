import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import sql from '../db'

export interface AuthRequest extends Request {
    user?: {
      user_id: number
      email: string
      role: string
      // הכיתה של המורה המשויך למשתמש; null אם אין שיוך. אדמין לא מוגבל לכיתה.
      grade: string | null
    }
  }

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    const authorization = req.headers.authorization

    if (!authorization) {
      return res.status(401).json({
        error: 'Token is missing'
      })
    }

    const token = authorization.split(' ')[1]//['Bearer', 'token']

    if (!token) {
      return res.status(401).json({
        error: 'Token is missing'
      })
    }

    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET is not set')
    }

    try {
      const payload = jwt.verify(token, secret) as {
        user_id: number
        email: string
        role: string
      }

      // התפקיד והכיתה נלקחים מהמסד ולא מהטוקן, כדי ששינויים ייכנסו לתוקף מיד
      const rows = await sql`
        SELECT u.role, t.grade
        FROM users u
        LEFT JOIN teachers t ON t.user_id = u.user_id
        WHERE u.user_id = ${payload.user_id}
      `
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      req.user = {
        user_id: payload.user_id,
        email: payload.email,
        role: rows[0].role,
        grade: rows[0].grade ?? null
      }

      next()

    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token'
      })
    }
  }


  export function isAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized' })
      return
    }
    next()
  }
