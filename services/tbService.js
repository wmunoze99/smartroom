const NodeCache = require("node-cache");
const fetcher = require("./fetcher");
const lodash = require("lodash");
const logger = require("../util/logger");
const DB = require("./mongo").getInstance();

class TBAdapter {
  static instance;

  #deviceCache = new NodeCache({
    checkperiod: 0,
  });

  state = "[TB] Initialiazing";

  #authToken = {
    token: "",
    refreshToken: "",
    lastRefresh: 0,
  };

  constructor() {
    this.#init();
  }

  static initTB = () => {
    if (!TBAdapter.instance) TBAdapter.instance = new TBAdapter();
    return TBAdapter.instance;
  };

  get countDevices() {
    return this.#deviceCache.keys().length;
  }

  get getDevices() {
    return this.#deviceCache.mget(this.#deviceCache.keys());
  }

  get devicesAsArray() {
    return this.#deviceCache.keys().map((key) => this.#deviceCache.get(key));
  }

  getDevice = (deviceID) => {
    return this.#deviceCache.get(deviceID);
  };

  #getAuthToken = async () => {
    if (
      Math.floor(Date.now()) / 1000 - this.#authToken.lastRefresh >
      process.env.REFRESH_INTERVAL + 600
    ) {
      logger.info("[TB] Refetching TB Auth Token");
      const response = await fetcher.post("/api/auth/login", {
        username: process.env.TBUSER,
        password: process.env.TBPASSWORD,
      });

      this.#authToken.token = response.data.token;
      this.#authToken.refreshToken = response.data.refreshToken;
      this.#authToken.lastRefresh = Math.floor(Date.now() / 1000);
      logger.info(
        `[TB] Token retrived sucessfully user ${process.env.TBUSER} loged in`
      );
    }
  };

  #retriveDevice = async (deviceId) => {
    await this.#getAuthToken();
    if (!this.#authToken) return;

    const { data: deviceResponse } = await fetcher.get(
      `/api/device/info/${deviceId}`,
      {
        headers: {
          "X-Authorization": `Bearer ${this.#authToken.token}`,
        },
      }
    );
    this.#storeDevice(deviceResponse);

    if (this.state !== "READY") this.state = "[TB] DEVICES GETTED";
  };

  #getTypesInformation = async (types) => {
    const typesAsArray = Array.from(types);
    const DevicesTypes = await DB.getModel("DeviceTypes");
    const devices = await DevicesTypes.find({
      name: { $in: typesAsArray },
    }).exec();
    return devices.map((device) => device.toObject());
  };

  #getTypeInformation = async (type) => {};

  #persistentDevices = async () => {
    await this.#getAuthToken();
    if (!this.#authToken) return;

    const { data: devicesResponse } = await fetcher.get(
      "/api/tenant/devices?page=0&pageSize=20",
      {
        headers: {
          "X-Authorization": `Bearer ${this.#authToken.token}`,
        },
      }
    );

    const uniqueDevicesTypes = new Set(
      devicesResponse.data.map((device) => device.type)
    );
    const types = await this.#getTypesInformation(uniqueDevicesTypes);

    this.#storeDevices(devicesResponse.data, types);
    logger.info(`[TB] ${this.#deviceCache.getStats().keys} devices identified`);
    if (this.state !== "READY") this.state = "[TB] READY";
  };

  #storeDevice(device) {
    this.state = "[CACHE] STORING";
    const success = this.#deviceCache.set(device.id.id, device);
    logger.info(`[CACHE] ${success}`);
  }

  #storeDevices(devices, types = []) {
    this.state = "[CACHE] STORING";
    const success = this.#deviceCache.mset(
      devices.map((device) => {
        const deviceIndex = types.findIndex(
          (type) => type.name === device.type
        );

        if (deviceIndex >= 0) {
          device.traits = types[deviceIndex].associatedTraits;
          device.gAttributes = types[deviceIndex].attributes;
          device.states = types[deviceIndex].states;
          device.commands = types[deviceIndex].commands;
        }

        return {
          key: device.id.id,
          val: device,
        };
      })
    );

    logger.info(`[CACHE] ${success}`);
  }

  #getCredentials = async () => {
    logger.info("[CACHE] Preparing Credentials");
    await Promise.all(
      this.#deviceCache.keys().map((device) => {
        return this.#getDeviceCredentials(device);
      })
    );
  };

  #getDeviceCredentials = async (deviceID) => {
    const { data: credential } = await fetcher(
      `/api/device/${deviceID}/credentials`,
      {
        headers: {
          "X-Authorization": `Bearer ${this.#authToken.token}`,
        },
      }
    );

    await this.#storeCredential(credential);
    this.state = "[TB] READY";
  };

  #storeCredential = async (credential) => {
    this.state = "[CACHE] STORING";
    const device = this.#deviceCache.get(credential.deviceId.id);
    device["credential"] = credential.credentialsId;
    const success = this.#deviceCache.set(credential.deviceId.id, device);
    logger.info(
      `[CACHE] Credential device id ${credential.deviceId.id} success`
    );
  };

  #getAttributes = async () => {
    logger.info("[ATTRIBUTES] UPDATING ATTRIBUTES");
    await Promise.all(
      this.#deviceCache.keys().map((device) => {
        const deviceAuth = this.#deviceCache.get(device).credential;
        return this.#fetchAttributes(deviceAuth, device);
      })
    );
  };

  #fetchAttributes = async (deviceAuth, deviceId) => {
    const { data: attributes } = await fetcher(
      `/api/v1/${deviceAuth}/attributes?clientKeys=_&sharedKeys=fw_checksum,traits&serverKeys=active`,
      {
        headers: {
          "X-Authorization": `Bearer ${this.#authToken.token}`,
        },
      }
    );
    const { data: serverSide } = await fetcher(
      `/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE`,
      {
        headers: {
          "X-Authorization": `Bearer ${this.#authToken.token}`,
        },
      }
    );

    const newAttributes = {
      ...attributes.shared,
      active: serverSide.find((attribute) => attribute.key === "active"),
    };

    await this.#storeAttributes(newAttributes, deviceId);
    this.state = "[TB] READY";
  };

  #storeAttributes = async (attribute, deviceId) => {
    this.state = "[CACHE] STORING";
    const device = this.#deviceCache.get(deviceId);
    device["attributes"] = attribute;
    const success = this.#deviceCache.set(deviceId, device);
    logger.info(`[CACHE] ATTRIBUTES DEVICE ID ${deviceId}, success`);
  };

  #init = async () => {
    logger.info("[TB] Configuring TB");
    await this.#getAuthToken();
    await this.#persistentDevices();
    await this.#getCredentials();
    await this.#getAttributes();
  };

  #refreshDevice = async (deviceId) => {
    await this.#retriveDevice(deviceId);
    await this.#getDeviceCredentials(deviceId);
    const credential = this.#deviceCache.get(deviceId).credential;
    await this.#fetchAttributes(credential, deviceId);
  };

  updateAttributes = async (deviceId, attributes) => {
    logger.info("[ATTRIBUTES] UPDATING ATTRIBUTES");
    const device = this.#deviceCache.get(deviceId);

    Object.keys(attributes).forEach((attribute) => {
      if (attribute in device.attributes) {
        device.attributes[attribute] = attributes[attribute];
      }
    });

    this.#deviceCache.set(deviceId, device);
    return device;
  };

  addNewDevice = (device) => {
    const credential = device.credentials;

    delete device.credentials;
    delete device.credentialsType;
    delete device.eventType;

    device.credential = credential;

    this.#deviceCache.set(device.id.id, device);
    this.#fetchAttributes(credential, device.id.id);
    return device;
  };

  updateDevice = (device) => {
    const credential = device.credentials;

    delete device.eventType;
    delete device.credentials;
    delete device.credentialsType;
    delete device.ss_active;

    this.#deviceCache.del(device.id.id);

    device.credential = credential;

    this.#fetchAttributes(credential, device.id.id);

    this.#deviceCache.set(device.id.id, device);

    return device;
  };

  deleteDevice = (device) => {
    this.#deviceCache.del(device.id.id);
    return device.id;
  };

  sendDeviceRPC = async (device, rpc) => {
    return await fetcher.post(`/api/rpc/oneway/${device}`, rpc, {
      headers: {
        "X-Authorization": `Bearer ${this.#authToken.token}`,
      },
    });
  };

  updateDeviceStatus = (deviceId, status) => {
    const device = this.#deviceCache.get(deviceId);

    if (lodash.has(device, "attributes.active.value")) {
      device.attributes.active.value = status;
      this.#deviceCache.set(deviceId, device);
    }

    return device;
  };
}

module.exports = {
  TBAdapter,
};
