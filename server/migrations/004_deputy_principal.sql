-- הוספת הרב יהונתן בונה כסגן מנהל - בעל תפקיד ללא כיתה (יקבל role=admin בהרשמה)
INSERT INTO teachers (name, grade, position)
SELECT 'הרב יהונתן בונה', NULL, 'סגן מנהל'
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE name = 'הרב יהונתן בונה');
