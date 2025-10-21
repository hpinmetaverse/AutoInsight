import { Router } from "express";
import { predictSentiment} from "../controller/getpredict.controller.js";
const router = Router();

router.post("/predict", predictSentiment);
// todo get messages
export default router;
