const serverless = require('serverless-http');
const express = require('express');
const axios = require('axios');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

module.exports.handler = serverless(app);

module.exports.getAccessToken = function(event, context, callback) {
  const { SANDBOX_ATOM_CLIENT_ID, SANDBOX_ATOM_CLIENT_SECRET } = process.env;

  // Don't prettier formet this line! It would cry SyntaxError invalid token ')' of sort. Weird i knw.
  const bufferCredential = Buffer.from(`${SANDBOX_ATOM_CLIENT_ID}:${SANDBOX_ATOM_CLIENT_SECRET}`);

  const base64Credential = bufferCredential.toString('base64');

  const requestConfig = {
    url:
      'https://sandbox.hydrogenplatform.com/authorization/v1/oauth/token?grant_type=client_credentials',
    method: 'post',
    headers: { Authorization: `Basic ${base64Credential}` },
  };

  axios(requestConfig)
    .then(function(res) {
      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // Required for CORS support to work
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify(res.data),
      };

      callback(null, response);
    })
    .catch(err => {
      const res = err.response.data;

      const errorResponse = {
        statusCode: res.status,
        headers: {
          'Access-Control-Allow-Origin': '*', // Required for CORS support to work
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({
          message: res.message
        }),
      };

      callback(null, errorResponse);
    });
};

module.exports.getRecommendedPortfolio = function (event, context, callback) {
  console.log('hey man', event.body)
}