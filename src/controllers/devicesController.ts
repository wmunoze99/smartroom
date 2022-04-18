import {
  SmartHomeV1SyncDevices,
  SmartHomeV1ExecuteRequestExecution
} from 'actions-on-google';
import axios from 'axios';
import { TBPayload } from '../models/TBpayload';
import Reviwer from './devicesWatchDog';

export default class DeviceController {
  public async getDevices() {
    const validToken = await authenticationController();

    const { data: response } = await axios.get(`${process.env.TB_URL}/api/tenant/deviceInfos?pageSize=10&page=0&sortProperty=createdTime&sortOrder=DESC&deviceProfileId=`, {
      headers: {
        'X-Authorization': `Bearer ${validToken}`
      }
    });
    const devices: SmartHomeV1SyncDevices[] = response.data.map((device: any) => {
      const deviceInformation = JSON.parse(device.additionalInfo.description);

      let googleSync: SmartHomeV1SyncDevices = {
        id: device.id.id,
        name: {
          name: device.label,
          nicknames: [device.label],
          defaultNames: [device.label]
        },
        traits: deviceInformation.traits.length > 0 ?
          sanitazeString(Types.traits, deviceInformation.traits) : [],
        type: sanitazeString(Types.types, device.type),
        willReportState: true,
        attributes: deviceInformation.attributes
      }

      return googleSync;
    });

    return devices;
  }

  public async sendRequestToDevice(deviceId: string, action: SmartHomeV1ExecuteRequestExecution) {
    const reviwer = Reviwer.getInstance();
    const device = reviwer.searchDevice(deviceId);

    if (device?.type == "FAN") {
      switch (action.command) {
        case "action.devices.commands.OnOff":
          return await this.senRPCRequest(deviceId, {
            method: 'setValueVelocity',
            params: action.params?.on ? 1 : 0
          });

        case "action.devices.commands.SetFanSpeed":
          return await this.senRPCRequest(deviceId, {
            method: 'setValueVelocity',
            params: +action.params.fanSpeed
          })

        default:
          return null;
      }
    }

    return null;
  }

  private senRPCRequest(deviceId: string, params: TBPayload) {
    return new Promise<any>((resolve, reject) => {
      authenticationController().then(token => {
        axios.post(`${process.env.TB_URL}/api/rpc/oneway/${deviceId}`, params, {
          headers: {
            'X-Authorization': `Bearer ${token}`
          }
        }).then(response => {
          resolve(response.data);
        }).catch(error => {
          reject(error);
        })
      });
    });
  }
}

/**
 * Checks if the stored token is valid in case not request a new one
 * @returns Valid JWT token to TB server
 */
export const authenticationController = () => {
  return new Promise<string>((resolve, reject) => {
    if (!process.env.TB_ISSUE || +process.env.TB_ISSUE + 9000000 < Date.now()) {
      axios.post(`${process.env.TB_URL}/api/auth/login`, {
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
}

const sanitazeString = (type: Types, value: string | string[]): any => {
  if (typeof value === "string")
    return `${type}${value}`

  const sanitazedValues = value.map((_value: string) => {
    return sanitazeString(type, _value);
  });

  return sanitazedValues;
}

const enum Types {
  traits = "action.devices.traits.",
  types = "action.devices.types."
}