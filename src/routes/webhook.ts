import express from 'express';
import Reviwer from '../controllers/devicesWatchDog';
const app = express.Router();

app.post('/recivedData', (req, res, next) => {
  console.log(req.body, req.headers);
  const reviwer = Reviwer.getInstance();
  const deviceId = req.headers.deviceid ? String(req.headers.deviceid) : "";
  res.json(reviwer.updateStatus(deviceId, req.body));
});

app.post('/notifyFailiure', (req, res, next) => {
  console.log(req.body, req.headers);
  res.json({
    state: "ok"
  });
});

export default app;