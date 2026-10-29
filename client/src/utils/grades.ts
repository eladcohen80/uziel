export const CLASSES = [
  'א1', 'א2', 'ב1', 'ב2', 'ג1', 'ג2', 'ד1', 'ד2', 'ד3',
  'ה1', 'ה2', 'ו1', 'ו2', 'מקדמת צעירה', 'מקדמת בוגרת'
]

// בעלי תפקידים שאינם משויכים לכיתה
export const POSITIONS = ['מנהלת', 'יועצת', 'רכז המרחב השלם']

export function isPromotingClass(className: string) {
  return !/^[א-ו]/.test(className)
}

export function classLabel(className: string) {
  return /^[א-ו]\d$/.test(className) ? `כיתה ${className}` : className
}
