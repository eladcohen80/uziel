import { Router } from 'express'
import { createPupil, updatePupil, updatePupilAvatar, deletePupil, getPupils, getPupilById } from '../controllers/pupilController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

router.use(authMiddleware)
router.post('/', createPupil)
router.patch('/:id/avatar', updatePupilAvatar)
router.put('/:id', updatePupil)
router.delete('/:id', deletePupil)
router.get('/', getPupils)
router.get('/:id', getPupilById)

export default router
