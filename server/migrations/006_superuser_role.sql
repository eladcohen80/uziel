-- הוספת הרשאת superuser: בעל תפקיד שרואה את כל הכיתות אך לא יכול להוסיף/לערוך/למחוק אנשי צוות
-- הרשאת admin נשארת ליועצת בלבד
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_role_check;
ALTER TABLE teachers ADD CONSTRAINT teachers_role_check CHECK (role IN ('user', 'superuser', 'admin'));
-- כל בעלי התפקידים שהוגדרו admin עד כה הופכים ל-superuser; היועצת תוגדר admin ידנית
UPDATE teachers SET role = 'superuser' WHERE role = 'admin';
UPDATE users SET role = 'superuser' WHERE role = 'admin';
