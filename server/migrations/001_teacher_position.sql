-- הוספת תמיכה בבעלי תפקידים (מנהלת, יועצת) שאינם משויכים לכיתה
ALTER TABLE teachers ALTER COLUMN grade DROP NOT NULL;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_grade_or_position_check;
ALTER TABLE teachers ADD CONSTRAINT teachers_grade_or_position_check
    CHECK ((grade IS NOT NULL) <> (position IS NOT NULL));
