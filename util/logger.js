const pino = require('pino');
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      colorizeObjects: 'true'
    }
  }
})

module.exports = logger;