import serverless from 'serverless-http';
import express from 'express';
import got from 'got';
import { getAccessTokenFromCookie } from './utilities.js';

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
        'Set-Cookie': `access_token=${
          res.body.access_token
        }; HttpOnly; domain=localhost`, // TODO: add 'Secure'
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

const CONSERVATIVE = 'convervative';
const MODERATE = 'moderate';
const AGGRESSIVE = 'aggressive';

const EARLY_SAVERS = 'earlySavers';
const MIDLIFE_SAVERS = 'midLifeSavers';
const RETIREE_SAVERS = 'retireeSavers';

function getRiskToleranceLevelType(totalRiskScore) {
  let toleranceType = '';

  if (totalRiskScore >= 12 && totalRiskScore <= 16) {
    toleranceType = AGGRESSIVE;
  } else if (totalRiskScore >= 7 && totalRiskScore <= 12) {
    toleranceType = MODERATE;
  } else if (totalRiskScore >= 4 && totalRiskScore <= 7) {
    toleranceType = CONSERVATIVE;
  }

  return toleranceType;
}

const AGE_TO_TOLERANCE_LEVEL_MAP = {
  [EARLY_SAVERS]: {
    [CONSERVATIVE]: '',
    [MODERATE]: '',
    [AGGRESSIVE]: '',
  },
};

function getAllocationModel(riskToleranceLevelType, age) {}
export function getRecommendedPortfolio(event, context, callback) {
  const accessToken = getAccessTokenFromCookie(event.headers.Cookie);
  const { totalRiskScore, age } = event.body;
  let portfolioId = '';

  const riskToleranceLevelType = getRiskToleranceLevelType(totalRiskScore);
  const allocationModel = getAllocationModel(riskToleranceLevelType, age);

  // console.log('hey man', hehe);
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000', // Need to properly set origin to receive response!
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({ loggedIn: true }),
  };

  callback(null, response);
}
