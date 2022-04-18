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
const devicesController_1 = require("./devicesController");
const axios_1 = __importDefault(require("axios"));
class Reviwer {
    constructor() {
        this.devices = [];
        this.getInitialDevices();
    }
    getInitialDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const validToken = yield (0, devicesController_1.authenticationController)();
            const { data: response } = yield axios_1.default.get(`${process.env.TB_URL}/api/tenant/deviceInfos?pageSize=10&page=0&sortProperty=createdTime&sortOrder=DESC&deviceProfileId=`, {
                headers: {
                    'X-Authorization': `Bearer ${validToken}`
                }
            });
            response.data.map((device) => {
                if (device.type == "FAN")
                    this.devices.push({
                        id: device.id.id,
                        lastUpdate: Date.now(),
                        type: device.type,
                        states: {
                            status: "SUCCESS",
                            online: true,
                            on: false,
                            currentFanSpeedSetting: 0,
                            currentToggleSettings: {
                                "rotation-toggle": false
                            }
                        }
                    });
                else if (device.type == "LIGHT")
                    this.devices.push({
                        id: device.id.id,
                        lastUpdate: Date.now(),
                        type: device.type,
                        states: {
                            status: "SUCCESS",
                            online: true,
                            on: false,
                        }
                    });
            });
        });
    }
    get getDevices() {
        return this.devices;
    }
    searchDevice(deviceId) {
        return this.devices.find((device) => device.id == deviceId);
    }
    updateStatus(deviceId, payload) {
        let device = this.devices[this.devices.findIndex((device) => device.id == deviceId)];
        if ((device === null || device === void 0 ? void 0 : device.type) == "FAN")
            switch (payload.method.toLowerCase()) {
                case "setvaluevelocity":
                    device.states.on = +payload.params > 0;
                    device.states.currentFanSpeedSetting = +payload.params;
                    break;
                case "setvaluerotate":
                    device.states.currentToggleSettings["rotation-toggle"] = payload.params == "true" ? true : false;
                    break;
                default:
                    return null;
            }
        device.lastUpdate = Date.now();
        return device;
    }
    static getInstance() {
        if (!Reviwer.instance)
            Reviwer.instance = new Reviwer();
        return Reviwer.instance;
    }
}
exports.default = Reviwer;
