import { Router } from "express";
import { aiTutor, generateQuiz } from "../controllers/ai.controller";
const router=Router();

router.post('/ai-tutor',aiTutor);
router.post('/generate-quiz',generateQuiz)
export default router;