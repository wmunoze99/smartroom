const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const logger = require('../util/logger');


class MongoFactory {
  static instance = null;
  #models = [];
  #conn;
  #previousConnection;

  constructor() {
    logger.warn("Be careful can be  unoptimized, a new connection is been created");

    process.on('SIGTERM', () => {
      logger.info("SIGTERM recieved closing connections");
      this.#conn.close();
      process.exit(0);
    });

    mongoose.connection.on('disconnected', () => {
      logger.info("[DB] Connection lost");
      this.#previousConnection = this.#conn;
      this.#conn = null;
    });

    mongoose.connection.on('reconnected', () => {
      this.#conn = this.#previousConnection;
      logger.info("[DB] Connection restored");
    });
  }

  static getInstance = () => {
    if (!MongoFactory.instance) {
      MongoFactory.instance = new MongoFactory();
    }

    return MongoFactory.instance
  }


  get getConnection() {
    return this.#conn;
  }

  getModel = async (name) => {
    await this.createConnection();
    return this.#models.find((model) => model.name === name).instance;
  }

  createConnection = async () => {
    const targetPath = path.join(__dirname, '../schemas');
    if (!fs.existsSync(targetPath)) throw new Error("Folder schemas not found");

    if (!this.#conn) {
      logger.info("[DB] Creating connection");
      this.#conn = await mongoose.createConnection(process.env.MONGO_CONNECTION_STRING, {
        connectTimeoutMS: 2000,
        maxIdleTimeMS: 30000
      }).asPromise();
      logger.info("[DB] Connection acomplish");

      const files = fs.readdirSync(targetPath);
      files.forEach(file => {
        const name = file.split('.')[0];
        if (!/^[A-Z]/.test(name)) throw new Error("File name should use cammel case");

        this.#models.push({
          name: file.split('.')[0],
          instance: this.#conn.model(name, require(`../schemas/${file}`))
        });
      });
      logger.info("[DB] PREPARED MODELS: " + files);
    }
    else {
      logger.info("[DB] USING MODELS: " + this.#models.map((model) => model.name));
    }
  }
}

module.exports = MongoFactory;