import express from 'express'
import sql from './db'
import teacherRoutes from './routes/teacherRoutes'
import pupilRoutes from './routes/pupilRoutes'
import authRoutes from './routes/authRoutes'

const app = express()
app.use(express.json())

app.use('/api/teachers', teacherRoutes)
app.use('/api/pupils', pupilRoutes)
app.use('/api/auth', authRoutes)

async function initDb() {
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
    await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE SET NULL`
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
    // class_suffix: המספר (1/2/3) נשמר קבוע; האות נגזרת משנת ההתחלה ב-view. במקדמות נשמר השם המלא.
    await sql`ALTER TABLE pupils ADD COLUMN IF NOT EXISTS class_suffix TEXT`
    // במקדמות אין שנת התחלה חובה
    await sql`ALTER TABLE pupils ALTER COLUMN startyeargrade1 DROP NOT NULL`
    const oldColumn = await sql`SELECT 1 FROM information_schema.columns WHERE table_name = 'pupils' AND column_name = 'class_name'`
    if (oldColumn.length > 0) {
        await sql`
            UPDATE pupils
            SET class_suffix = CASE WHEN class_name ~ '^[א-ו][0-9]+$' THEN substr(class_name, 2) ELSE class_name END
            WHERE class_suffix IS NULL
        `
        await sql`DROP VIEW IF EXISTS pupils_view`
        await sql`ALTER TABLE pupils DROP COLUMN class_name`
    }
    await sql`
        CREATE OR REPLACE VIEW pupils_view AS
        SELECT p.*,
            CASE WHEN p.class_suffix ~ '^[0-9]+$'
                THEN COALESCE((ARRAY['א','ב','ג','ד','ה','ו'])[s.year - p.startyeargrade1 + 1] || p.class_suffix, 'סיים')
                ELSE p.class_suffix
            END AS class_name
        FROM pupils p
        CROSS JOIN LATERAL (
            SELECT CASE WHEN EXTRACT(MONTH FROM now()) >= 9 THEN EXTRACT(YEAR FROM now())::int ELSE EXTRACT(YEAR FROM now())::int - 1 END AS year
        ) s
    `
}

const port = Number(process.env.PORT) || 3000

initDb()
    .then(() => {
        app.listen(port, () => console.log(`Server listening on port ${port}`))
    })
    .catch(error => {
        console.error('Failed to initialize database', error)
        process.exit(1)
    })
