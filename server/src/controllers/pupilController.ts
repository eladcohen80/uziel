import { Response } from 'express'
import sql from '../db'
import { AuthRequest } from '../middleware/authMiddleware'
import { classSuffix, classToStartYear, isValidClass } from '../utils/grades'
import { getCloudinaryCredentials } from '../utils/cloudinary'

// null = admin/superuser (ללא הגבלה); מחרוזת = הכיתה היחידה המותרת; undefined = אין גישה
function allowedClass(req: AuthRequest): string | null | undefined {
    if (req.user?.role === 'admin' || req.user?.role === 'superuser') return null
    return req.user?.grade ?? undefined
}

function forbidNoClass(res: Response) {
    return res.status(403).json({ error: 'המשתמש אינו משויך לכיתה' })
}

function isCloudinaryAvatarUrl(value: unknown, cloudName: string): value is string {
    if (typeof value !== 'string' || value.length > 2048) return false

    try {
        const url = new URL(value)
        return url.protocol === 'https:' &&
            url.hostname === 'res.cloudinary.com' &&
            url.port === '' &&
            url.username === '' &&
            url.password === '' &&
            url.pathname.split('/')[1] === cloudName &&
            url.pathname.startsWith(`/${cloudName}/image/upload/`)
    } catch {
        return false
    }
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
    const { name, Integration, Diagnosis, Educationalresponse, Emotionalresponse, Otherresponse, Notes } = req.body
    // משתמש רגיל יכול ליצור תלמידים רק בכיתה שלו
    const className = cls === null ? req.body.className : cls
    if (!isValidClass(className)) return res.status(400).json({ error: 'Invalid class' })
    const startYearGrade1 = classToStartYear(className, req.body.startYearGrade1)
    if (startYearGrade1 === null) return res.status(400).json({ error: 'Start year required for this class' })
    const avatarUrl = req.body?.avatar_url ?? null
    if (avatarUrl !== null) {
        const credentials = getCloudinaryCredentials()
        if (!credentials) {
            return res.status(503).json({ error: 'העלאת תמונות אינה מוגדרת בשרת' })
        }
        if (!isCloudinaryAvatarUrl(avatarUrl, credentials.cloudName)) {
            return res.status(400).json({ error: 'Avatar URL must be a Cloudinary image URL' })
        }
    }
    try {
        const newPupil = await sql`
            INSERT INTO pupils (name, startYearGrade1, class_suffix, Integration, Diagnosis, Educationalresponse, Emotionalresponse, Otherresponse, Notes, avatar_url)
            VALUES (${name}, ${startYearGrade1}, ${classSuffix(className)}, ${Integration}, ${Diagnosis}, ${Educationalresponse}, ${Emotionalresponse}, ${Otherresponse}, ${Notes}, ${avatarUrl})
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
    const { name, Integration, Diagnosis, Educationalresponse, Emotionalresponse, Otherresponse, Notes } = req.body
    const className = cls === null ? req.body.className : cls
    if (!isValidClass(className)) return res.status(400).json({ error: 'Invalid class' })
    const startYearGrade1 = classToStartYear(className, req.body.startYearGrade1)
    if (startYearGrade1 === null) return res.status(400).json({ error: 'Start year required for this class' })
    try {
        const updatedPupil = await sql`
            UPDATE pupils
            SET name = ${name}, startYearGrade1 = ${startYearGrade1}, class_suffix = ${classSuffix(className)}, Integration = ${Integration}, Diagnosis = ${Diagnosis}, Educationalresponse = ${Educationalresponse}, Emotionalresponse = ${Emotionalresponse}, Otherresponse = ${Otherresponse}, Notes = ${Notes}
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

export const updatePupilAvatar = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)

    const credentials = getCloudinaryCredentials()
    if (!credentials) {
        return res.status(503).json({ error: 'העלאת תמונות אינה מוגדרת בשרת' })
    }

    const avatarUrl = req.body?.avatar_url
    if (!isCloudinaryAvatarUrl(avatarUrl, credentials.cloudName)) {
        return res.status(400).json({ error: 'Avatar URL must be a Cloudinary image URL' })
    }

    try {
        const updatedPupil = await sql`
            UPDATE pupils
            SET avatar_url = ${avatarUrl}
            WHERE id = ${id} AND (${cls}::text IS NULL OR id IN (SELECT id FROM pupils_view WHERE class_name = ${cls}::text))
            RETURNING id, avatar_url
        `
        if (updatedPupil.length === 0) {
            return res.status(404).json({ error: 'Pupil not found' })
        }
        return res.json(updatedPupil[0])
    } catch (error) {
        console.error('Failed to update pupil avatar', error)
        return res.status(500).json({ error: 'Failed to update pupil avatar' })
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
