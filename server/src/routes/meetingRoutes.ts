import { Router } from "express";
import { getAllMeetings, getMeetings, getMeetingById, createMeeting, updateMeeting, deleteMeeting } from "../controllers/meetingController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getAllMeetings);
router.get("/meeting/:id", getMeetingById);
router.post("/meeting", createMeeting);
router.put("/meeting/:id", updateMeeting);
router.delete("/meeting/:id", deleteMeeting);
router.get("/:pupil_id", getMeetings);

export default router;