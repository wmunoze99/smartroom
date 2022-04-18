"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions_on_google_1 = require("actions-on-google");
const devicesController_1 = __importDefault(require("../controllers/devicesController"));
const devicesWatchDog_1 = __importDefault(require("../controllers/devicesWatchDog"));
const app = (0, actions_on_google_1.smarthome)();
const deviceController = new devicesController_1.default();
app.onSync((body, headers) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(body, headers);
    const devices = yield deviceController.getDevices();
    return {
        requestId: body.requestId,
        payload: {
            agentUserId: "",
            devices: devices
        }
    };
}));
app.onExecute((body, headers) => __awaiter(void 0, void 0, void 0, function* () {
    const _ = headers;
    const commands = [];
    const { devices, execution } = body.inputs[0].payload.commands[0];
    console.log("execute");
    console.log(devices, execution, headers);
    for (let device of devices) {
        for (let exec of execution) {
            const response = yield deviceController.sendRequestToDevice(device.id, exec);
        }
    }
    commands.push({
        ids: devices.map(device => device.id),
        status: "SUCCESS"
    });
    return {
        requestId: Math.random().toString(),
        payload: {
            commands: commands,
        }
    };
}));
app.onQuery((body, headers) => __awaiter(void 0, void 0, void 0, function* () {
    const { devices } = body.inputs[0].payload;
    const reviwer = devicesWatchDog_1.default.getInstance();
    console.log("Query");
    console.log(headers, devices, body.inputs);
    let devicesStatus = {};
    for (let device of devices) {
        devicesStatus[device.id] = reviwer.searchDevice(device.id);
    }
    return {
        requestId: body.requestId,
        payload: {
            devices: devicesStatus
        }
    };
}));
app.onDisconnect((body, headers) => {
    return {};
});
exports.default = app;
