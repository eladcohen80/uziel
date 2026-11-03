import { Response } from "express";
import sql from '../db'
import { AuthRequest } from '../middleware/authMiddleware'

// null = admin/superuser (ללא הגבלה); מחרוזת = הכיתה היחידה המותרת; undefined = אין גישה
function allowedClass(req: AuthRequest): string | null | undefined {
    if (req.user?.role === 'admin' || req.user?.role === 'superuser') return null
    return req.user?.grade ?? undefined
}

function forbidNoClass(res: Response) {
    return res.status(403).json({ error: 'המשתמש אינו משויך לכיתה' })
}

export const getAllMeetings = async (req: AuthRequest, res: Response) => {
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        // משתמש רגיל רואה רק פגישות של תלמידים בכיתה שלו
        const meetings = await sql`
            SELECT * FROM meetings
            WHERE (${cls}::text IS NULL OR pupil_id IN (SELECT id FROM pupils_view WHERE class_name = ${cls}::text))
            ORDER BY date DESC
        `;
        res.json(meetings);
    } catch (error) {
        console.error('Error in getAllMeetings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getMeetings = async (req: AuthRequest, res: Response) => {
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        const { pupil_id } = req.params;

        // בדיקה בסיסית שהפרמטר באמת הגיע ולא ריק
        if (!pupil_id) {
            res.status(400).json({ error: 'pupil_id parameter is required' });
            return;
        }

        // שליפת הפגישות ומיונן מהחדשה לישנה
        const meetings = await sql`
            SELECT * FROM meetings
            WHERE pupil_id = ${pupil_id}
            AND (${cls}::text IS NULL OR pupil_id IN (SELECT id FROM pupils_view WHERE class_name = ${cls}::text))
            ORDER BY date DESC
        `;

        // החזרת המערך הנקי לצד הלקוח
        res.json(meetings);
    } catch (error) {
        console.error('Error in getMeetings:', error); // עוזר לך לראות שגיאות בטרמינל בזמן הפיתוח
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getMeetingById = async (req: AuthRequest, res: Response) => {
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'id parameter is required' });
            return;
        }
        const result = await sql`
            SELECT * FROM meetings
            WHERE id = ${id}
            AND (${cls}::text IS NULL OR pupil_id IN (SELECT id FROM pupils_view WHERE class_name = ${cls}::text))
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        res.json(result[0]);
    } catch (error) {
        console.error('Error in getMeetingById:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createMeeting = async (req: AuthRequest, res: Response) => {
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        const { date, subject, participants, summary_and_recommendations, pupil_id } = req.body;

        // מערך ריק של משתתפים עובר את הבדיקה !participants - בודקים גם אורך
        if (!date || !subject || !Array.isArray(participants) || participants.length === 0 || !summary_and_recommendations || !pupil_id) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        // משתמש רגיל יכול ליצור פגישה רק לתלמיד בכיתה שלו
        if (cls !== null) {
            const allowed = await sql`SELECT 1 FROM pupils_view WHERE id = ${pupil_id} AND class_name = ${cls}`
            if (allowed.length === 0) {
                res.status(403).json({ error: 'אין הרשאה לתלמיד זה' });
                return;
            }
        }

        const result = await sql`INSERT INTO meetings (date, subject, participants, summary_and_recommendations, pupil_id)
                                 VALUES (${date}, ${subject}, ${participants}, ${summary_and_recommendations}, ${pupil_id})
                                 RETURNING *`;
        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Error in createMeeting:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateMeeting = async (req: AuthRequest, res: Response) => {
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        const { id } = req.params;
        const { date, subject, participants, summary_and_recommendations, pupil_id } = req.body;

        if (!id) {
            res.status(400).json({ error: 'id parameter is required' });
            return;
        }

        if (!date || !subject || !Array.isArray(participants) || participants.length === 0 || !summary_and_recommendations || !pupil_id) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        const result = await sql`UPDATE meetings
                                 SET date = ${date}, subject = ${subject}, participants = ${participants}, summary_and_recommendations = ${summary_and_recommendations}, pupil_id = ${pupil_id}
                                 WHERE id = ${id}
                                 AND (${cls}::text IS NULL OR pupil_id IN (SELECT id FROM pupils_view WHERE class_name = ${cls}::text))
                                 RETURNING *`;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json(result[0]);
    } catch (error) {
        console.error('Error in updateMeeting:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteMeeting = async (req: AuthRequest, res: Response) => {
    const cls = allowedClass(req)
    if (cls === undefined) return forbidNoClass(res)
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'id parameter is required' });
            return;
        }
        const result = await sql`
            DELETE FROM meetings
            WHERE id = ${id}
            AND (${cls}::text IS NULL OR pupil_id IN (SELECT id FROM pupils_view WHERE class_name = ${cls}::text))
            RETURNING *`;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        res.json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Error in deleteMeeting:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

