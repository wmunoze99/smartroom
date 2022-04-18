"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const devicesWatchDog_1 = __importDefault(require("../controllers/devicesWatchDog"));
const router = express_1.default.Router();
router.get("/", (req, res) => {
    const reviwer = devicesWatchDog_1.default.getInstance();
    res.json({
        express: "Server running",
        thingsBoardServer: "Server Running: " + process.env.TB_URL,
        syncDevices: reviwer.getDevices
    });
});
exports.default = router;
