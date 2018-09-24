import serverless from 'serverless-http';
import express from 'express';
import got from 'got';
import {
  getAccessTokenFromCookie,
  getAllocationId,
  getRiskToleranceLevelType,
  sortArrayByDesc,
  roundValuesUpToTarget,
} from './utilities.js';

const app = express();
const OAUTH_URL =
  'https://sandbox.hydrogenplatform.com/authorization/v1/oauth/token?grant_type=client_credentials';
const BASE_URL = 'https://sandbox.hydrogenplatform.com/nucleus/v1';

const httpClient = accessToken =>
  got.extend({
    baseUrl: BASE_URL,
    json: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

let ACCESS_TOKEN = '';

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

// function(modelId: number[] | number) => Promise
function fetchModelHolding(modelId) {
  const modelHoldingRequestConfig = {
    query: {
      filter: `model_id==${
        Array.isArray(modelId) ? modelId.join(',model_id==') : modelId
      }`,
    },
  };
  return httpClient(ACCESS_TOKEN)('/model_holding', modelHoldingRequestConfig);
}

function fetchAllocation(allocationId) {
  return httpClient(ACCESS_TOKEN)(`/allocation/${allocationId}`);
}

function fetchAllocationComposition(allocationId) {
  const allocCompoRequestConfig = {
    query: {
      filter: `allocation_id==${allocationId}`,
    },
  };
  return httpClient(ACCESS_TOKEN)(
    '/allocation_composition',
    allocCompoRequestConfig,
  );
}

export async function getRecommendedPortfolio(event, context, callback) {
  ACCESS_TOKEN = getAccessTokenFromCookie(event.headers.Cookie);

  const { totalRiskScore, age } = JSON.parse(event.body);

  const riskToleranceLevelType = getRiskToleranceLevelType(totalRiskScore);
  const allocationId = getAllocationId(age, riskToleranceLevelType);

  try {
    // Grab all model ids from '/allocation_composition'
    // given an allocation_id
    const allocCompoResponse = await fetchAllocationComposition(allocationId);
    const allocCompoObj = allocCompoResponse.body.content.reduce(
      (acc, curr) => {
        const { model_id, strategic_weight: weight } = curr;
        acc[model_id] = { weight };
        return acc;
      },
      {},
    );

    // Grab model's holdings and its details
    const [modelHoldingsResponse, allocationResponse] = await Promise.all([
      fetchModelHolding(Object.keys(allocCompoObj)),
      fetchAllocation(allocationId),
    ]);

    // Grab all security's id and put in an array
    const securitiesArr = modelHoldingsResponse.body.content.reduce(
      (acc, curr) => {
        const {
          security_id: securityId,
          strategic_weight: weight,
          model_id: modelId,
        } = curr;
        const assetWeight = Math.round(
          (allocCompoObj[modelId].weight / 100) * weight,
        );
        acc[securityId] = { weight: assetWeight };
        return acc;
      },
      {},
    );

    // Get details of the securities
    const securityRequestConfig = {
      query: {
        filter: `id==${Object.keys(securitiesArr).join(',id==')}`,
      },
    };
    const securitiesRes = await httpClient(ACCESS_TOKEN)(
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

    // when traslate /allocation_composition's weight
    // to model's weight don't add up to 100 (percent)
    roundValuesUpToTarget({
      source: holdingsArr,
      target: 100,
      accessorKey: 'weight',
    });

    // Sort by holding's weight
    const results = sortArrayByDesc(holdingsArr, 'weight');

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000', // Need to properly set origin to receive response!
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        holdings: results,
        portfolio: allocationResponse.body,
      }),
    };

    callback(null, response);
  } catch (error) {
    const response = {
      statusCode: error.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        message: error.statusMessage,
      }),
    };

    callback(null, response);
  }
}
