import express from "express";
import mediaInfo from "../controllers/mediaInfo";
import getStream from "../controllers/getStream";
import { createProxyMiddleware } from "http-proxy-middleware";
import getSeasonList from "../controllers/getSeasonList";
import downloadController from "../controllers/downloadController";

const router = express.Router();

router.get("/mediaInfo", mediaInfo);
router.post("/getStream", getStream);
router.get("/getSeasonList", getSeasonList);
router.post("/download", downloadController);

export default router;
