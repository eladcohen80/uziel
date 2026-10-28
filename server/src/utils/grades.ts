export const CLASSES = [
    'א1', 'א2', 'ב1', 'ב2', 'ג1', 'ג2', 'ד1', 'ד2', 'ד3',
    'ה1', 'ה2', 'ו1', 'ו2', 'מקדמת צעירה', 'מקדמת בוגרת'
]

const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו']

// בעלי תפקידים שאינם משויכים לכיתה
export const POSITIONS = ['מנהלת', 'יועצת']

export function isValidPosition(value: unknown): value is string {
    return typeof value === 'string' && POSITIONS.includes(value)
}

// שנת הלימודים מתחילה ב-1 בספטמבר
export function getCurrentSchoolYear() {
    const now = new Date()
    return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
}

export function isValidClass(value: unknown): value is string {
    return typeof value === 'string' && CLASSES.includes(value)
}

export function isPromotingClass(className: string) {
    return LETTERS.indexOf(className[0]) === -1
}

// המספר נשמר קבוע (האות משתנה עם השנה); במקדמות נשמר השם המלא
export function classSuffix(className: string) {
    return isPromotingClass(className) ? className : className.slice(1)
}

// שנת ההתחלה נקבעת לפי האות בלבד (א1/א2 זהים). במקדמות היא מוזנת ידנית.
export function classToStartYear(className: string, manualStartYear?: unknown) {
    if (isPromotingClass(className)) {
        return Number.isInteger(manualStartYear) ? (manualStartYear as number) : null
    }
    return getCurrentSchoolYear() - LETTERS.indexOf(className[0])
}
