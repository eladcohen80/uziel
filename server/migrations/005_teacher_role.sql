-- הוספת הרשאות צפייה לאיש צוות: admin רואה את כל הכיתות, user רק את הכיתה שלו
-- ההרשאה נקבעת על ידי האדמין בעת ההוספה, ומועתקת למשתמש בעת ההרשמה
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
-- שמירה על ההתנהגות הקיימת: בעלי תפקיד שאינם משויכים לכיתה הם אדמינים
UPDATE teachers SET role = 'admin' WHERE position IS NOT NULL;
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_role_check;
ALTER TABLE teachers ADD CONSTRAINT teachers_role_check CHECK (role IN ('user', 'admin'));
