import { Request, Response } from 'express'
import sql from '../db'
import { AuthRequest } from '../middleware/authMiddleware'

// איש צוות משויך לכיתה (grade) או בעל תפקיד ללא כיתה (position) - בדיוק אחד מהם. הערכים חופשיים
function parseGradeAndPosition(grade: unknown, position: unknown) {
    const hasGrade = typeof grade === 'string' && grade.trim() !== ''
    const hasPosition = typeof position === 'string' && position.trim() !== ''
    if (hasGrade === hasPosition) return null
    return {
        grade: hasGrade ? (grade as string).trim() : null,
        position: hasPosition ? (position as string).trim() : null
    }
}

// הרשאות: admin = היועצת בלבד (ניהול צוות); superuser = צפייה בכל הכיתות; user = הכיתה שלו בלבד
function parseRole(role: unknown) {
    return role === 'admin' || role === 'superuser' ? role : 'user'
}

export const createTeacher = async (req: Request, res: Response) => {
    const { name, grade, position, role } = req.body
    const parsed = parseGradeAndPosition(grade, position)
    if (!parsed) return res.status(400).json({ error: 'יש למלא כיתה או תפקיד' })
    // היועצת מוגנת - ההרשאה שלה תמיד admin
    const newRole = parsed.position === 'יועצת' ? 'admin' : parseRole(role)
    try {
        const newTeacher = await sql`
            INSERT INTO teachers (name, grade, position, role)
            VALUES (${name}, ${parsed.grade}, ${parsed.position}, ${newRole})
            RETURNING id, name, grade, position, role, user_id
        `
        res.status(201).json(newTeacher[0])
    } catch (error) {
        res.status(500).json({ error: 'Failed to create teacher' })
    }
}

// עריכת איש צוות מותרת ליועצת (admin) בלבד
export const updateTeacher = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { name, grade, position, role } = req.body
    const parsed = parseGradeAndPosition(grade, position)
    if (!parsed) return res.status(400).json({ error: 'יש למלא כיתה או תפקיד' })
    // היועצת מוגנת - ההרשאה שלה תמיד admin ולא ניתן לשנות אותה דרך הטופס
    const newRole = parsed.position === 'יועצת' ? 'admin' : parseRole(role)
    try {
        const updatedTeacher = await sql`
            UPDATE teachers
            SET name = ${name}, grade = ${parsed.grade}, position = ${parsed.position}, role = ${newRole}
            WHERE id = ${id}
            RETURNING id, name, grade, position, role, user_id
        `
        if (updatedTeacher.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' })
        }
        // אם איש הצוות כבר שויך למשתמש - מעדכנים גם את ההרשאה שלו, כדי שהשינוי יכנס לתוקף
        if (updatedTeacher[0].user_id) {
            await sql`UPDATE users SET role = ${newRole} WHERE user_id = ${updatedTeacher[0].user_id}`
        }
        res.json(updatedTeacher[0])
    } catch (error) {
        res.status(500).json({ error: 'Failed to update teacher' })
    }
}

export const deleteTeacher = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const deletedTeacher = await sql`
            DELETE FROM teachers
            WHERE id = ${id}
            RETURNING *
        `
        if (deletedTeacher.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' })
        }
        res.json({ message: 'Teacher deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete teacher' })
    }
}

export const getTeachers = async (req: AuthRequest, res: Response) => {
    try {
        // admin ו-superuser רואים את כל אנשי הצוות; משתמש רגיל רק את עצמו
        const seesAll = req.user?.role === 'admin' || req.user?.role === 'superuser'
        const teachers = seesAll
            ? await sql`SELECT id, name, grade, position, role, user_id FROM teachers`
            : await sql`SELECT id, name, grade, position, role, user_id FROM teachers WHERE user_id = ${req.user!.user_id}`
        res.json(teachers)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teachers' })
    }
}

// מורים שעוד לא שויכו למשתמש - לבחירה בהרשמה (ללא אימות)
export const getAvailableTeachers = async (req: Request, res: Response) => {
    try {
        const teachers = await sql`SELECT id, name, grade, position FROM teachers WHERE user_id IS NULL ORDER BY grade NULLS LAST, name`
        res.json(teachers)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teachers' })
    }
}

export const getTeacherById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    try {
        const seesAll = req.user?.role === 'admin' || req.user?.role === 'superuser'
        const teacher = seesAll
            ? await sql`SELECT id, name, grade, position, role, user_id FROM teachers WHERE id = ${id}`
            : await sql`SELECT id, name, grade, position, role, user_id FROM teachers WHERE id = ${id} AND user_id = ${req.user!.user_id}`
        if (teacher.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' })
        }
        res.json(teacher[0])
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teacher' })
    }
}

