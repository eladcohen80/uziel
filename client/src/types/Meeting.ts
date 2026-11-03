// date מגיע מהשרת כמחרוזת JSON; pupil_id הוא UUID כמו pupils.id
export type Meeting = {
    id: string
    date: string
    subject: string
    participants: string[]
    summary_and_recommendations: string
    pupil_id: string
}