import schedule from 'node-schedule';
import { authenticationController } from './devicesController';
import axios from 'axios';
import { Device } from '../models/device';
import { TBPayload } from '../models/TBpayload';

export default class Reviwer {
  private static instance: Reviwer;
  private devices: Device[] = [];

  constructor() {
    this.getInitialDevices();
  }

  private async getInitialDevices() {
    const validToken = await authenticationController();
    const { data: response } = await axios.get(`${process.env.TB_URL}/api/tenant/deviceInfos?pageSize=10&page=0&sortProperty=createdTime&sortOrder=DESC&deviceProfileId=`, {
      headers: {
        'X-Authorization': `Bearer ${validToken}`
      }
    });

    response.data.map((device: any) => {
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
  }

  get getDevices() {
    return this.devices;
  }

  public searchDevice(deviceId: string) {
    return this.devices.find((device) => device.id == deviceId);
  }

  public updateStatus(deviceId: string, payload: TBPayload) {
    let device = this.devices[this.devices.findIndex((device) => device.id == deviceId)];

    if (device?.type == "FAN")
      switch (payload.method.toLowerCase()) {
        case "setvaluevelocity":
          device.states.on = +payload.params > 0;
          device.states.currentFanSpeedSetting = +payload.params
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

  public static getInstance(): Reviwer {
    if (!Reviwer.instance)
      Reviwer.instance = new Reviwer();
    return Reviwer.instance;
  }
}