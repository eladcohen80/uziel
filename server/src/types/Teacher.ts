export type Teacher = {
  id: string;
  // null כשמדובר בבעל תפקיד שאינו משויך לכיתה
  grade: string | null;
  // null כשמדובר במורה כיתה
  position: string | null;
  name: string;
};