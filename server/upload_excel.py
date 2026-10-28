import os
import sys

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

sys.stdout.reconfigure(encoding="utf-8")

# 1. הגדרות נתיבים וחיבורים
EXCEL_FILE = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\eladc\Downloads\pupils_list.xlsx"  # נתיב לקובץ האקסל (אפשר גם כארגומנט)
load_dotenv()  # טוען את server/.env
NEON_DATABASE_URL = os.environ.get("DATABASE_URL")  # ה-Connection string מ-Neon
if not NEON_DATABASE_URL:
    raise SystemExit("❌ חסר DATABASE_URL בקובץ .env")
TABLE_NAME = "pupils"  # שם הטבלה ב-Neon

# רשימת העמודות המדויקת מהתמונה שלך
REQUIRED_COLUMNS = [
    "class_suffix",
    "notes",
    "otherresponse",
    "emotionalresponse",
    "educationalresponse",
    "startyeargrade1",
    "name"
]

try:
    # 2. קריאת קובץ האקסל לתוך Pandas DataFrame
    print("⏳ קורא את קובץ האקסל...")
    df = pd.read_excel(EXCEL_FILE)

    # 3. ניקוי והתאמת עמודות
    # הסרת רווחים מיותרים משמות העמודות באקסל (למניעת שגיאות הקלדה)
    df.columns = df.columns.str.strip()
    
    # סינון ה-DataFrame כך שיכיל אך ורק את העמודות שקיימות בתמונה
    # (אם יש עמודות חסרות באקסל, הקוד ייצר אותן כריקות כדי לא לשבור את המבנה ב-Neon)
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            df[col] = None
            
    df = df[REQUIRED_COLUMNS]

    # בכיתות א-ו נשמר רק המספר (האות מחושבת אוטומטית משנת ההתחלה); במקדמות נשמר השם המלא
    df["class_suffix"] = df["class_suffix"].astype(str).str.strip().str.replace(r"^[א-ו](\d)$", r"\1", regex=True)
    df["startyeargrade1"] = pd.to_numeric(df["startyeargrade1"], errors="coerce").astype("Int64")

    # 4. יצירת חיבור לבסיס הנתונים של Neon
    engine = create_engine(NEON_DATABASE_URL, connect_args={"sslmode": "require"})

    # 5. הכנסת הנתונים ל-Neon
    print(f"🚀 מעלה {len(df)} שורות לטבלה '{TABLE_NAME}' ב-Neon...")
    
    # if_exists='append': מוסיף את השורות לטבלה קיימת
    # index=False: מונע מ-Pandas להוסיף עמודה של מספר שורה אוטומטי (Index)
    df.to_sql(TABLE_NAME, con=engine, if_exists='append', index=False)
    
    print("✅ המידע הועלה בהצלחה!")

except Exception as e:
    print(f"❌ שגיאה במהלך ההעלאה: {e}")
