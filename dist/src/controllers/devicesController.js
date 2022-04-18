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
exports.authenticationController = void 0;
const axios_1 = __importDefault(require("axios"));
const devicesWatchDog_1 = __importDefault(require("./devicesWatchDog"));
class DeviceController {
    getDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const validToken = yield (0, exports.authenticationController)();
            const { data: response } = yield axios_1.default.get(`${process.env.TB_URL}/api/tenant/deviceInfos?pageSize=10&page=0&sortProperty=createdTime&sortOrder=DESC&deviceProfileId=`, {
                headers: {
                    'X-Authorization': `Bearer ${validToken}`
                }
            });
            const devices = response.data.map((device) => {
                const deviceInformation = JSON.parse(device.additionalInfo.description);
                let googleSync = {
                    id: device.id.id,
                    name: {
                        name: device.label,
                        nicknames: [device.label],
                        defaultNames: [device.label]
                    },
                    traits: deviceInformation.traits.length > 0 ?
                        sanitazeString("action.devices.traits." /* traits */, deviceInformation.traits) : [],
                    type: sanitazeString("action.devices.types." /* types */, device.type),
                    willReportState: true,
                    attributes: deviceInformation.attributes
                };
                return googleSync;
            });
            return devices;
        });
    }
    sendRequestToDevice(deviceId, action) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const reviwer = devicesWatchDog_1.default.getInstance();
            const device = reviwer.searchDevice(deviceId);
            if ((device === null || device === void 0 ? void 0 : device.type) == "FAN") {
                switch (action.command) {
                    case "action.devices.commands.OnOff":
                        return yield this.senRPCRequest(deviceId, {
                            method: 'setValueVelocity',
                            params: ((_a = action.params) === null || _a === void 0 ? void 0 : _a.on) ? 1 : 0
                        });
                    case "action.devices.commands.SetFanSpeed":
                        return yield this.senRPCRequest(deviceId, {
                            method: 'setValueVelocity',
                            params: +action.params.fanSpeed
                        });
                    default:
                        return null;
                }
            }
            return null;
        });
    }
    senRPCRequest(deviceId, params) {
        return new Promise((resolve, reject) => {
            (0, exports.authenticationController)().then(token => {
                axios_1.default.post(`${process.env.TB_URL}/api/rpc/oneway/${deviceId}`, params, {
                    headers: {
                        'X-Authorization': `Bearer ${token}`
                    }
                }).then(response => {
                    resolve(response.data);
                }).catch(error => {
                    reject(error);
                });
            });
        });
    }
}
exports.default = DeviceController;
/**
 * Checks if the stored token is valid in case not request a new one
 * @returns Valid JWT token to TB server
 */
const authenticationController = () => {
    return new Promise((resolve, reject) => {
        if (!process.env.TB_ISSUE || +process.env.TB_ISSUE + 9000000 < Date.now()) {
            axios_1.default.post(`${process.env.TB_URL}/api/auth/login`, {
                username: process.env.TB_USERNAME,
                password: process.env.TB_PASSWORD
            })
                .then(response => {
                process.env.TB_ISSUE = Date.now().toString();
                process.env.TB_TOKEN = response.data.token;
                resolve(response.data.token);
            }).catch(error => {
                reject(error);
            });
        }
        else {
            resolve(process.env.TB_TOKEN + "");
        }
    });
};
exports.authenticationController = authenticationController;
const sanitazeString = (type, value) => {
    if (typeof value === "string")
        return `${type}${value}`;
    const sanitazedValues = value.map((_value) => {
        return sanitazeString(type, _value);
    });
    return sanitazedValues;
};
