import { Response } from 'express'
import sql from '../db'
import { AuthRequest } from '../middleware/authMiddleware'
import { classSuffix, classToStartYear, isValidClass } from '../utils/grades'

// null = אדמין (ללא הגבלה); מחרוזת = הכיתה היחידה המותרת; undefined = אין גישה
function allowedClass(req: AuthRequest): string | null | undefined {
    if (req.user?.role === 'admin') return null
    return req.user?.grade ?? undefined
}

function forbidNoClass(res: Response) {
    return res.status(403).json({ error: 'המשתמש אינו משויך לכיתה' })
}

export const getPupils = async (req: AuthRequest, res: Response) => {
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        const pupils = cls === null
            ? await sql`SELECT * FROM pupils_view`
            : await sql`SELECT * FROM pupils_view WHERE class_name = ${cls}`
        res.json(pupils)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pupils' })
    }
}

export const getPupilById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        const pupil = cls === null
            ? await sql`SELECT * FROM pupils_view WHERE id = ${id}`
            : await sql`SELECT * FROM pupils_view WHERE id = ${id} AND class_name = ${cls}`
        if (pupil.length === 0) {
            return res.status(404).json({ error: 'Pupil not found' })
        }
        res.json(pupil[0])
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pupil' })
    }
}

export const createPupil = async (req: AuthRequest, res: Response) => {
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    const { name, Educationalresponse, Emotionalresponse, Otherresponse, Notes } = req.body
    // משתמש רגיל יכול ליצור תלמידים רק בכיתה שלו
    const className = cls === null ? req.body.className : cls
    if (!isValidClass(className)) return res.status(400).json({ error: 'Invalid class' })
    const startYearGrade1 = classToStartYear(className, req.body.startYearGrade1)
    if (startYearGrade1 === null) return res.status(400).json({ error: 'Start year required for this class' })
    try {
        const newPupil = await sql`
            INSERT INTO pupils (name, startYearGrade1, class_suffix, Educationalresponse, Emotionalresponse, Otherresponse, Notes)
            VALUES (${name}, ${startYearGrade1}, ${classSuffix(className)}, ${Educationalresponse}, ${Emotionalresponse}, ${Otherresponse}, ${Notes})
            RETURNING *
        `
        res.status(201).json(newPupil[0])
    } catch (error) {
        res.status(500).json({ error: 'Failed to create pupil' })
    }
}

export const updatePupil = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    const { name, Educationalresponse, Emotionalresponse, Otherresponse, Notes } = req.body
    const className = cls === null ? req.body.className : cls
    if (!isValidClass(className)) return res.status(400).json({ error: 'Invalid class' })
    const startYearGrade1 = classToStartYear(className, req.body.startYearGrade1)
    if (startYearGrade1 === null) return res.status(400).json({ error: 'Start year required for this class' })
    try {
        const updatedPupil = await sql`
            UPDATE pupils
            SET name = ${name}, startYearGrade1 = ${startYearGrade1}, class_suffix = ${classSuffix(className)}, Educationalresponse = ${Educationalresponse}, Emotionalresponse = ${Emotionalresponse}, Otherresponse = ${Otherresponse}, Notes = ${Notes}
            WHERE id = ${id} AND (${cls}::text IS NULL OR id IN (SELECT id FROM pupils_view WHERE class_name = ${cls}::text))
            RETURNING *
        `
        if (updatedPupil.length === 0) {
            return res.status(404).json({ error: 'Pupil not found' })
        }
        res.json(updatedPupil[0])
    } catch (error) {
        res.status(500).json({ error: 'Failed to update pupil' })
    }
}

export const deletePupil = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        const deletedPupil = await sql`
            DELETE FROM pupils
            WHERE id = ${id} AND (${cls}::text IS NULL OR id IN (SELECT id FROM pupils_view WHERE class_name = ${cls}::text))
            RETURNING *
        `
        if (deletedPupil.length === 0) {
            return res.status(404).json({ error: 'Pupil not found' })
        }
        res.json({ message: 'Pupil deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete pupil' })
    }
}
