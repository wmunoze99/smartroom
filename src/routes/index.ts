import express from 'express';
import Reviwer from '../controllers/devicesWatchDog';
const router = express.Router();

router.get("/", (req, res) => {
  const reviwer = Reviwer.getInstance();
  res.json({
    express: "Server running",
    thingsBoardServer: "Server Running: " + process.env.TB_URL,
    syncDevices: reviwer.getDevices
  });
});

export default router;