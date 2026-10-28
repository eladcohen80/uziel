// שליחת מייל דרך Brevo (https://api.brevo.com/v3/smtp/email)
const BREVO_API_KEY = process.env.BREVO_API_KEY
const SENDER_EMAIL = process.env.EMAIL_SENDER
const SENDER_NAME = process.env.EMAIL_SENDER_NAME || 'מיפוי מענים'

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
    if (!BREVO_API_KEY || !SENDER_EMAIL) {
        throw new Error('BREVO_API_KEY or EMAIL_SENDER is not set')
    }
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
            accept: 'application/json'
        },
        body: JSON.stringify({
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ email }],
            subject: 'איפוס סיסמה - מיפוי מענים',
            htmlContent: `<html dir="rtl" lang="he"><body>
                <p>שלום,</p>
                <p>התקבלה בקשה לאיפוס הסיסמה שלך. לחץ על הקישור הבא כדי לבחור סיסמה חדשה (הקישור תקף לשעה):</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p>אם לא ביקשת לאפס את הסיסמה, אפשר להתעלם מהודעה זו.</p>
            </body></html>`
        })
    })
    if (!response.ok) {
        const body = await response.text()
        throw new Error(`Brevo failed: ${response.status} ${body}`)
    }
}
