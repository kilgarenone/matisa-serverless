import serverless from 'serverless-http';
import express from 'express';
import got from 'got';
import {
  getAccessTokenFromCookie,
  getAllocationModelId,
  getRiskToleranceLevelType,
  sortArrayByDesc,
} from './utilities.js';

const app = express();
const OAUTH_URL =
  'https://sandbox.hydrogenplatform.com/authorization/v1/oauth/token?grant_type=client_credentials';
const BASE_URL = 'https://sandbox.hydrogenplatform.com/nucleus/v1';

const client = accessToken =>
  got.extend({
    baseUrl: BASE_URL,
    json: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

app.get('/', (req, res) => {
  res.send('Hello World');
});

export const handler = serverless(app);

export async function getAccessToken(event, context) {
  const { SANDBOX_ATOM_CLIENT_ID, SANDBOX_ATOM_CLIENT_SECRET } = process.env;

  // Don't prettier format this line! It would cry SyntaxError invalid token ')' of sort. Weird i knw.
  const bufferCredential = Buffer.from(
    `${SANDBOX_ATOM_CLIENT_ID}:${SANDBOX_ATOM_CLIENT_SECRET}`,
  );
  const base64Credential = bufferCredential.toString('base64');

  const requestConfig = {
    method: 'POST',
    json: true,
    headers: { Authorization: `Basic ${base64Credential}` },
  };

  try {
    const res = await got(OAUTH_URL, requestConfig);
    return {
      statusCode: res.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        'Set-Cookie': `access_token=${res.body.access_token}; HttpOnly; `, // TODO: add 'Secure'
      },
      body: JSON.stringify({ loggedIn: true }),
    };
  } catch (error) {
    return {
      statusCode: error.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        message: error.statusMessage,
      }),
    };
  }
}

export async function getRecommendedPortfolio(event, context, callback) {
  const accessToken = getAccessTokenFromCookie(event.headers.Cookie);
  const { totalRiskScore, age } = JSON.parse(event.body);

  const riskToleranceLevelType = getRiskToleranceLevelType(totalRiskScore);
  const allocationModelId = getAllocationModelId(age, riskToleranceLevelType);

  try {
    // Get holdings of a model
    const modelHoldingRequestConfig = {
      query: {
        filter: `model_id==${allocationModelId}`,
      },
    };
    const modelHoldingsRes = await client(accessToken)(
      '/model_holding',
      modelHoldingRequestConfig,
    );

    // Grab all security's id and put in an array
    const securitiesArr = modelHoldingsRes.body.content.reduce((acc, curr) => {
      acc[curr.security_id] = { weight: curr.strategic_weight };
      return acc;
    }, {});

    // Get details of the securities
    const securityRequestConfig = {
      query: {
        filter: `id==${Object.keys(securitiesArr).join(',id==')}`,
      },
    };
    const securitiesRes = await client(accessToken)(
      '/security',
      securityRequestConfig,
    );

    // Add more details
    const holdingsArr = securitiesRes.body.content.map(security => ({
      ...securitiesArr[security.id],
      ...{
        name: security.name,
        ticker: security.ticker,
        assetClass: security.asset_class,
      },
    }));

    // Sort by holding's weight
    sortArrayByDesc(holdingsArr, 'weight');

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000', // Need to properly set origin to receive response!
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(holdingsArr),
    };

    callback(null, response);
  } catch (error) {
    console.log('error', error);
    // callback(null, );
  }
}
