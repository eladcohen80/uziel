import { Request, Response } from 'express'
import sql from '../db'
import { AuthRequest } from '../middleware/authMiddleware'
import { isValidClass, isValidPosition } from '../utils/grades'

// מורה משויך לכיתה (grade) או בעל תפקיד ללא כיתה (position) - בדיוק אחד מהם
function parseGradeAndPosition(grade: unknown, position: unknown) {
    const hasGrade = isValidClass(grade)
    const hasPosition = isValidPosition(position)
    if (hasGrade === hasPosition) return null
    return { grade: hasGrade ? grade : null, position: hasPosition ? position : null }
}

export const createTeacher = async (req: Request, res: Response) => {
    const { name, grade, position } = req.body
    const parsed = parseGradeAndPosition(grade, position)
    if (!parsed) return res.status(400).json({ error: 'יש לבחור כיתה או תפקיד' })
    try {
        const newTeacher = await sql`
            INSERT INTO teachers (name, grade, position)
            VALUES (${name}, ${parsed.grade}, ${parsed.position})
            RETURNING id, name, grade, position, user_id
        `
        res.status(201).json(newTeacher[0])
    } catch (error) {
        res.status(500).json({ error: 'Failed to create teacher' })
    }
}

export const updateTeacher = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { name, grade, position } = req.body
    const isAdmin = req.user?.role === 'admin'
    const parsed = parseGradeAndPosition(grade, position)
    if (isAdmin && !parsed) return res.status(400).json({ error: 'יש לבחור כיתה או תפקיד' })
    try {
        // משתמש רגיל יכול לשנות רק את השם של המורה המשויך אליו; הכיתה/התפקיד נשארים
        const updatedTeacher = isAdmin
            ? await sql`
                UPDATE teachers
                SET name = ${name}, grade = ${parsed!.grade}, position = ${parsed!.position}
                WHERE id = ${id}
                RETURNING id, name, grade, position, user_id
            `
            : await sql`
                UPDATE teachers
                SET name = ${name}
                WHERE id = ${id} AND user_id = ${req.user!.user_id}
                RETURNING id, name, grade, position, user_id
            `
        if (updatedTeacher.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' })
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
        const teachers = req.user?.role === 'admin'
            ? await sql`SELECT id, name, grade, position, user_id FROM teachers`
            : await sql`SELECT id, name, grade, position, user_id FROM teachers WHERE user_id = ${req.user!.user_id}`
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
        const teacher = req.user?.role === 'admin'
            ? await sql`SELECT id, name, grade, position, user_id FROM teachers WHERE id = ${id}`
            : await sql`SELECT id, name, grade, position, user_id FROM teachers WHERE id = ${id} AND user_id = ${req.user!.user_id}`
        if (teacher.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' })
        }
        res.json(teacher[0])
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teacher' })
    }
}

