import type { Meeting } from '../types/Meeting'

// Postgres עלול להחזיר עמודת TEXT[] כמחרוזת {"א","ב"} במקום מערך - מפרסרים לרשימת מחרוזות
export function parseParticipants(participants: Meeting['participants']): string[] {
    if (Array.isArray(participants)) return participants
    return String(participants)
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map(p => p.trim().replace(/^"|"$/g, ''))
        .filter(Boolean)
}
