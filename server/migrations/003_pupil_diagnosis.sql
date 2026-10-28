-- הוספת עמודת איבחון לתלמידים
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS Diagnosis TEXT;
