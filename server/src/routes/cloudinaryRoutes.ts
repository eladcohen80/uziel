import express from 'express';
import { cloudinary, getCloudinaryCredentials } from '../utils/cloudinary'
import { authMiddleware } from '../middleware/authMiddleware'

const router = express.Router();

router.get('/cloudinary-signature', authMiddleware, (req, res) => {
    const credentials = getCloudinaryCredentials()
    if (!credentials) {
        return res.status(503).json({ error: 'העלאת תמונות אינה מוגדרת בשרת' })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = 'students_avatars'
    const uploadPreset = 'uziel_preset'

    try {
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, folder, upload_preset: uploadPreset },
            credentials.apiSecret
        )

        return res.json({
            signature,
            timestamp,
            folder,
            uploadPreset,
            cloudName: credentials.cloudName,
            apiKey: credentials.apiKey
        })
    } catch (error) {
        console.error('Failed to create Cloudinary signature', error)
        return res.status(500).json({ error: 'יצירת חתימת העלאה נכשלה' })
    }
})

export default router;
