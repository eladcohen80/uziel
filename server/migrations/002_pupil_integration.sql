-- הוספת עמודת שילוב/סל אישי לתלמידים
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS Integration TEXT;
