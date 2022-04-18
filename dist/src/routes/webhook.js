"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const devicesWatchDog_1 = __importDefault(require("../controllers/devicesWatchDog"));
const app = express_1.default.Router();
app.post('/recivedData', (req, res, next) => {
    console.log(req.body, req.headers);
    const reviwer = devicesWatchDog_1.default.getInstance();
    const deviceId = req.headers.deviceid ? String(req.headers.deviceid) : "";
    res.json(reviwer.updateStatus(deviceId, req.body));
});
app.post('/notifyFailiure', (req, res, next) => {
    console.log(req.body, req.headers);
    res.json({
        state: "ok"
    });
});
exports.default = app;
