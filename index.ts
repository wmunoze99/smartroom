import cors from 'cors';
import dotenv from 'dotenv';
import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';

import index from './src/routes/index';
import webhook from './src/routes/webhook';

import fulfillment from './src/routes/fulfillment';

// Read environment variables
dotenv.config();

const app = express();
app.use(logger('short'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

// App routes
app.use('/', index);
app.use('/fulfillment', fulfillment);
app.use('/webhooks', webhook);

app.listen(3000, () => {
  console.log("App running on port 3000");
});