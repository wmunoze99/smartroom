const axios = require('axios');

const fetcher = axios.create({
  baseURL: 'https://iottools.tk',
});

module.exports = fetcher;