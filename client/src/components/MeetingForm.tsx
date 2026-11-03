import type { Meeting } from "../types/Meeting";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getMeetingById, createMeeting, updateMeeting } from "../services/meetingService";
import { getPupilById } from "../services/pupilService";

const EMPTY_MEETING: Meeting = {
    id: "",
    date: "",
    subject: "",
    participants: [],
    summary_and_recommendations: "",
    pupil_id: ""
}

const participantOptions = ['יועצת', 'מחנכ/ת', 'מנהלת', 'פסיכולוג', 'אבא', 'אמא'];

export default function MeetingForm() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // ביצירת פגישה חדשה אפשר להעביר pupil_id ב-query string (למשל מכפתור בכרטיס תלמיד)
    const [meeting, setMeeting] = useState<Meeting>({ ...EMPTY_MEETING, pupil_id: searchParams.get('pupil_id') ?? '' });
    const [pupilName, setPupilName] = useState('');
    const [error, setError] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [otherSelected, setOtherSelected] = useState(false);
    const [otherText, setOtherText] = useState('');
    useEffect(() => {
        if (id) {
            getMeetingById(id).then(meeting => {
                setMeeting(meeting);
                const participants = Array.isArray(meeting.participants) ? meeting.participants : [];
                // משתתפים שאינם ברשימה הקבועה נטענים לשדה "אחר"
                setSelectedParticipants(participants.filter(p => participantOptions.includes(p)));
                const others = participants.filter(p => !participantOptions.includes(p));
                if (others.length > 0) {
                    setOtherSelected(true);
                    setOtherText(others.join(', '));
                }
            })
            .catch(() => setError("שגיאה בטעינת הפגישה"));
        }
    }, [id])

    // שם התלמיד מוצג בטופס במקום המזהה (לקריאה בלבד)
    useEffect(() => {
        if (!meeting.pupil_id) return;
        getPupilById(meeting.pupil_id)
            .then(pupil => setPupilName(pupil.name))
            .catch(() => setError("שגיאה בטעינת התלמיד"));
    }, [meeting.pupil_id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!meeting.pupil_id) {
            setError("חסר תלמיד - יש להוסיף פגישה מטבלת התלמידים");
            return;
        }

        // הטקסט החופשי של "אחר" מתווסף לרשימת המשתתפים
        const finalParticipants = [...selectedParticipants];
        if (otherSelected && otherText.trim() !== '') {
            finalParticipants.push(otherText.trim());
        }

        const meetingDataToSend = { ...meeting, participants: finalParticipants };
        try {
            if (id) {
                await updateMeeting(id, meetingDataToSend);
                navigate('/pupiles');
            } else {
                await createMeeting(meetingDataToSend);
                // נשארים בטופס כדי לאפשר הוספת פגישה נוספת לאותו תלמיד
                setMeeting({ ...EMPTY_MEETING, pupil_id: meeting.pupil_id });
                setSelectedParticipants([]);
                setOtherSelected(false);
                setOtherText('');
            }
        } catch {
            setError("שגיאה בשמירת הפגישה");
        }
    };

    function toggleParticipant(option: string) {
        setSelectedParticipants(prev =>
            prev.includes(option) ? prev.filter(p => p !== option) : [...prev, option]
        );
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMeeting(prev => ({ ...prev, [name]: value }));
    }
    return (
        <form className="form form-wide" onSubmit={handleSubmit}>
            <label>
                תאריך:
                <input type="date" name="date" value={meeting.date ? meeting.date.slice(0, 10) : ''} onChange={handleChange} required />
            </label>
            <label>
                נושא:
                <input type="text" name="subject" value={meeting.subject} onChange={handleChange} required />
            </label>
            <fieldset className="form-radios">
                <legend>משתתפים:</legend>
                {participantOptions.map(option => (
                    <label key={option}>
                        <input type="checkbox" checked={selectedParticipants.includes(option)} onChange={() => toggleParticipant(option)} />
                        {option}
                    </label>
                ))}
                <label>
                    <input type="checkbox" checked={otherSelected} onChange={e => setOtherSelected(e.target.checked)} />
                    אחר...
                </label>
                {otherSelected && (
                    <input
                        type="text"
                        placeholder="אנא ציין..."
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                    />
                )}
            </fieldset>
            <label>
                סיכום והמלצות:
                <textarea name="summary_and_recommendations" value={meeting.summary_and_recommendations} onChange={handleChange} required />
            </label>
            <label>
                שם התלמיד:
                <input type="text" value={pupilName} readOnly />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
                <button type="submit">שמירה</button>
                <button type="button" onClick={() => navigate('/pupiles')}>סגירה</button>
            </div>
        </form>
    );
}
