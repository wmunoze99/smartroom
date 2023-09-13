require('dotenv').config();

const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');
const cors = require('cors');
const { TBAdapter } = require('./services/tbService');
const logger = require('./util/logger');
const pino = require('pino-http')({
  logger: logger
});

const indexRouter = require('./routes/index');
const tbRouter = require('./routes/tb');
const devicesRouter = require('./routes/devices');
const fulfillment = require('./routes/fullfilment');

TBAdapter.initTB();

const app = express();

/* const { auth } = require('express-oauth2-jwt-bearer');

const checkauth = auth({
  audience: process.env.AUDIENCE,
  issuerBaseURL: process.env.ISSUER,
  tokenSigningAlg: 'RS256'
}); */



app.use(pino);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/tb', tbRouter);
app.use('/api/devices', devicesRouter);
app.use('/fulfillment', fulfillment);

module.exports = app;