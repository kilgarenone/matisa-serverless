const serverless = require('serverless-http');
const express = require('express');
const app = express();
const axios = require('axios');

app.get('/', (req, res) => {
  res.send('hdadada');
});

module.exports.handler = serverless(app);
module.exports.getAccessToken = function(event, context, callback) {
  // const body = JSON.parse(event.body);

  const { SANDBOX_ATOM_CLIENT_ID, SANDBOX_ATOM_CLIENT_SECRET } = process.env;

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
      console.log(res);
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
    .catch(e => {
      console.log(e);
      const errorResponse = {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*', // Required for CORS support to work
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        // body: JSON.stringify({
        //   message: error.title,
        // }),
      };
      callback(null, errorResponse);
    });
};
