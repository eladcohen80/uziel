import express from 'express'
import sql from './db'
import teacherRoutes from './routes/teacherRoutes'
import pupilRoutes from './routes/pupilRoutes'
import authRoutes from './routes/authRoutes'
import meetingRoutes from './routes/meetingRoutes'

const app = express()
app.use(express.json())

// CORS - הקליינט מתארח בדומיין נפרד ב-Vercel
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
        res.sendStatus(204)
        return
    }
    next()
})

// מחכים לאתחול מסד הנתונים לפני טיפול בבקשות (חשוב ב-serverless)
// אחרי כשל ה-promise מתאפס כדי שהבקשה הבאה תנסה שוב (אחרת ה-instance נשאר תקוע על הכשל הראשון)
let dbReady: Promise<void> | null = null
function ensureDbReady() {
    if (!dbReady) {
        dbReady = initDbWithRetry()
        dbReady.catch(() => { dbReady = null })
    }
    return dbReady
}
app.use('/api', async (_req, res, next) => {
    try {
        await ensureDbReady()
        next()
    } catch (error) {
        console.error('Failed to initialize database', error)
        // details נוסף זמנית לצורך דיבוג ב-Vercel - אפשר להסיר אחרי שהבעיה תתברר
        res.status(500).json({ error: 'שגיאה באתחול מסד הנתונים', details: String(error) })
    }
})

app.use('/api/teachers', teacherRoutes)
app.use('/api/pupils', pupilRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/meetings', meetingRoutes)

// מתעלם משגיאות "כבר קיים" - קורה כשכמה serverless functions מאתחלות את מסד הנתונים במקביל ב-Vercel
async function allowExists(query: PromiseLike<unknown>) {
    try {
        await query
    } catch (error) {
        // 42P07 = טבלה/view כבר קיים, 42710 = constraint כבר קיים, 42701 = עמודה כבר קיימת
        // 23505 = מפתח כפול בקטלוג (pg_type_typname_nsp_index) - שני אתחולים מקבילים יצרו את אותו האובייקט
        const code = (error as { code?: string })?.code
        if (!['42P07', '42710', '42701', '23505'].includes(code ?? '') && !String(error).includes('already exists')) {
            throw error
        }
    }
}

// אתחול מקביל של כמה serverless functions עלול להתנגש בקטלוג של Neon - מנסים שוב עם השהיה
async function initDbWithRetry(attempts = 3) {
    for (let attempt = 1; ; attempt++) {
        try {
            await initDb()
            return
        } catch (error) {
            if (attempt >= attempts) throw error
            await new Promise(resolve => setTimeout(resolve, 500 * attempt))
        }
    }
}

// גרסת הסכמה - לעלות בכל שינוי ב-initDb. האתחול רץ פעם אחת בלבד ולא בכל cold start,
// כדי למנוע התנגשויות קטלוג כשכמה serverless functions עולים במקביל ב-Vercel
// 2 = הרשאות אנשי צוות: עמודת role ב-teachers (user/superuser/admin)
// 3 = טבלת meetings: פגישות של תלמידים
const SCHEMA_VERSION = 3

async function initDb() {
    await sql`
        CREATE TABLE IF NOT EXISTS app_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `
    const versionRow = await sql`SELECT value FROM app_meta WHERE key = 'schema_version'`
    if (Number(versionRow[0]?.value) >= SCHEMA_VERSION) return
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            user_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user'
        )
    `
    await sql`
        CREATE TABLE IF NOT EXISTS teachers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            grade INTEGER NOT NULL
        )
    `
    // בטבלה קיימת שלא נוצרה ע"י initDb העמודה עלולה להיות חסרה
    await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS grade INTEGER`
    await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE SET NULL`
    await sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL
        )
    `
    await sql`
        CREATE TABLE IF NOT EXISTS pupils (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            startYearGrade1 INTEGER NOT NULL,
            Educationalresponse TEXT,
            Emotionalresponse TEXT,
            Otherresponse TEXT,
            Notes TEXT
        )
    `
    // מעבר מכיתה מספרית (1-6) לשם כיתה (למשל א1)
    await sql`
        DO $$
        BEGIN
            IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'grade') = 'integer' THEN
                ALTER TABLE teachers ALTER COLUMN grade TYPE TEXT USING (
                    CASE grade WHEN 1 THEN 'א1' WHEN 2 THEN 'ב1' WHEN 3 THEN 'ג1'
                    WHEN 4 THEN 'ד1' WHEN 5 THEN 'ה1' WHEN 6 THEN 'ו1' ELSE 'א1' END
                );
            END IF;
        END $$
    `
    // בעלי תפקידים (מנהלת/סגן מנהל/יועצת/רכז) אינם משויכים לכיתה - בדיוק אחד מ-grade/position
    // DROP NOT NULL מותנה כדי לא לכתוב לקטלוג בכל אתחול (כתיבות מקבילות לקטלוג מתנגשות ב-Neon)
    await sql`
        DO $$
        BEGIN
            IF (SELECT is_nullable FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'grade') = 'NO' THEN
                ALTER TABLE teachers ALTER COLUMN grade DROP NOT NULL;
            END IF;
        END $$
    `
    await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS position TEXT`
    await allowExists(sql`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_grade_or_position_check') THEN
                ALTER TABLE teachers ADD CONSTRAINT teachers_grade_or_position_check
                    CHECK ((grade IS NOT NULL) <> (position IS NOT NULL));
            END IF;
        END $$
    `)
    // פגישות של תלמידים; pupil_id הוא UUID כמו pupils.id. מחיקת תלמיד מוחקת גם את הפגישות שלו
    await sql`
        CREATE TABLE IF NOT EXISTS meetings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date DATE NOT NULL,
            subject TEXT NOT NULL,
            participants TEXT[] NOT NULL,
            summary_and_recommendations TEXT NOT NULL,
            pupil_id UUID NOT NULL REFERENCES pupils(id) ON DELETE CASCADE
        )
    `
    // בטבלה קיימת שלא נוצרה ע"י initDb העמודה עלולה להיות חסרה
    await sql`ALTER TABLE pupils ADD COLUMN IF NOT EXISTS startyeargrade1 INTEGER`
    // class_suffix: המספר (1/2/3) נשמר קבוע; האות נגזרת משנת ההתחלה ב-view. במקדמות נשמר השם המלא.
    await sql`ALTER TABLE pupils ADD COLUMN IF NOT EXISTS class_suffix TEXT`
    await sql`ALTER TABLE pupils ADD COLUMN IF NOT EXISTS Integration TEXT`
    await sql`ALTER TABLE pupils ADD COLUMN IF NOT EXISTS Diagnosis TEXT`
    // במקדמות אין שנת התחלה חובה
    await sql`
        DO $$
        BEGIN
            IF (SELECT is_nullable FROM information_schema.columns WHERE table_name = 'pupils' AND column_name = 'startyeargrade1') = 'NO' THEN
                ALTER TABLE pupils ALTER COLUMN startyeargrade1 DROP NOT NULL;
            END IF;
        END $$
    `
    const oldColumn = await sql`SELECT 1 FROM information_schema.columns WHERE table_name = 'pupils' AND column_name = 'class_name'`
    if (oldColumn.length > 0) {
        await sql`
            UPDATE pupils
            SET class_suffix = CASE WHEN class_name ~ '^[א-ו][0-9]+$' THEN substr(class_name, 2) ELSE class_name END
            WHERE class_suffix IS NULL
        `
        await sql`DROP VIEW IF EXISTS pupils_view`
        await sql`ALTER TABLE pupils DROP COLUMN IF EXISTS class_name`
    }
    // הרשאות איש צוות: admin = היועצת בלבד (ניהול צוות); superuser = צפייה בכל הכיתות; user = הכיתה שלו בלבד
    await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`
    await allowExists(sql`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_role_check') THEN
                ALTER TABLE teachers ADD CONSTRAINT teachers_role_check CHECK (role IN ('user', 'superuser', 'admin'));
            END IF;
        END $$
    `)
    // המרה חד-פעמית: בעלי תפקידים שהוגדרו admin לפני ההפרדה ל-superuser הופכים ל-superuser.
    // מי שכבר admin (היועצת) לא נוגעים בו - ההמרה פועלת רק על admin שמקורו בבעל תפקיד ישן
    await sql`UPDATE teachers SET role = 'superuser' WHERE role = 'admin' AND position IS NOT NULL AND position <> 'יועצת'`
    await sql`UPDATE users SET role = 'superuser' WHERE role = 'admin' AND user_id IN (SELECT user_id FROM teachers WHERE role = 'superuser' AND user_id IS NOT NULL)`
    // הגנה קבועה: היועצת תמיד admin, גם אם ההרשאה שונתה בטעות דרך הטופס או ישירות ב-DB
    await sql`UPDATE teachers SET role = 'admin' WHERE position = 'יועצת' AND role <> 'admin'`
    await sql`UPDATE users SET role = 'admin' WHERE role <> 'admin' AND user_id IN (SELECT user_id FROM teachers WHERE position = 'יועצת' AND user_id IS NOT NULL)`
    // הרב יהונתן בונה - סגן מנהל; בעל תפקיד ללא כיתה, יקבל role=superuser בהרשמה (צפייה בכל הכיתות)
    await sql`
        INSERT INTO teachers (name, grade, position, role)
        SELECT 'הרב יהונתן בונה', NULL, 'סגן מנהל', 'superuser'
        WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE name = 'הרב יהונתן בונה')
    `
    // יוצרים מחדש את ה-view רק אם הוא חסר או חסרות בו עמודות - drop/create בכל אתחול מתנגש באתחול מקביל של serverless functions
    const viewStatus = await sql`
        SELECT to_regclass('pupils_view') IS NOT NULL AS view_exists,
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns p
                WHERE p.table_name = 'pupils'
                AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns v
                    WHERE v.table_name = 'pupils_view' AND v.column_name = p.column_name
                )
            ) AS up_to_date
    `
    if (!viewStatus[0].view_exists || !viewStatus[0].up_to_date) {
        // DROP לפני יצירה מחדש כי CREATE OR REPLACE לא יכול לשנות עמודות ב-view קיים
        await sql`DROP VIEW IF EXISTS pupils_view`
        await allowExists(sql`
            CREATE VIEW pupils_view AS
            SELECT p.*,
                CASE WHEN p.class_suffix ~ '^[0-9]+$'
                    THEN COALESCE((ARRAY['א','ב','ג','ד','ה','ו'])[s.year - p.startyeargrade1 + 1] || p.class_suffix, 'סיים')
                    ELSE p.class_suffix
                END AS class_name
            FROM pupils p
            CROSS JOIN LATERAL (
                SELECT CASE WHEN EXTRACT(MONTH FROM now()) >= 9 THEN EXTRACT(YEAR FROM now())::int ELSE EXTRACT(YEAR FROM now())::int - 1 END AS year
            ) s
        `)
    }
    // מסמן שהאתחול הושלם - cold starts הבאים ידלגו על כל ה-DDL
    await sql`
        INSERT INTO app_meta (key, value) VALUES ('schema_version', ${String(SCHEMA_VERSION)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `
}

export default app

// האזנה לפורט מקומית בלבד; ב-Vercel האפליקציה רצה כ-serverless function
if (!process.env.VERCEL) {
    const port = Number(process.env.PORT) || 3000
    ensureDbReady()
        .then(() => {
            app.listen(port, () => console.log(`Server listening on port ${port}`))
        })
        .catch(error => {
            console.error('Failed to initialize database', error)
            process.exit(1)
        })
}
