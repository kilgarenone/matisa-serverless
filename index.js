import serverless from "serverless-http";
import express from "express";
import querystring from "querystring";
import got from "got";
import {
  getAccessTokenFromCookie,
  getAllocationId,
  getRiskToleranceLevelType,
  sortArrayByDesc,
  roundValuesUpToTarget
} from "./utilities.js";

const app = express();
const BASE_URL = "https://sandbox.hydrogenplatform.com/nucleus/v1";

const httpClient = accessToken =>
  got.extend({
    baseUrl: BASE_URL,
    json: true,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

let ACCESS_TOKEN = "";

app.get("/", (req, res) => {
  res.send("Hello World");
});

export const handler = serverless(app);

// function(modelId: number[] | number) => Promise
function fetchModelHolding(modelId) {
  const modelHoldingRequestConfig = {
    query: {
      filter: `model_id==${
        Array.isArray(modelId) ? modelId.join(",model_id==") : modelId
      }`
    }
  };
  return httpClient(ACCESS_TOKEN).get(
    "/model_holding",
    modelHoldingRequestConfig
  );
}

function fetchAllocation(allocationId) {
  return httpClient(ACCESS_TOKEN).get(`/allocation/${allocationId}`);
}

function fetchAllocationComposition(allocationId) {
  const allocCompoRequestConfig = {
    query: {
      filter: `allocation_id==${allocationId}`
    }
  };
  return httpClient(ACCESS_TOKEN).get(
    "/allocation_composition",
    allocCompoRequestConfig
  );
}

const ACC_TYPE_TAX_ADVANTAGED = "101";
const ACC_TYPE_TAXABLE = "100";

const ACCOUNT_TYPE = {
  [ACC_TYPE_TAX_ADVANTAGED]: {
    name: "Tax-advantaged Investment Account",
    id: "dad8a90e-76ed-42ad-8ca3-4e4048f20af7"
  },
  [ACC_TYPE_TAXABLE]: {
    name: "Taxable Investment Account",
    id: "12dde151-73aa-4f45-b2fa-73a618c36c92"
  }
};

function createAccount(clientId, accountType) {
  return httpClient(ACCESS_TOKEN).post("/account", {
    body: {
      name: ACCOUNT_TYPE[accountType].name,
      account_type_id: ACCOUNT_TYPE[accountType].id,
      clients: [
        { client_id: clientId, client_account_association_type: "owner" }
      ]
    }
  });
}
export async function registerClient(event, context, callback) {
  ACCESS_TOKEN = ACCESS_TOKEN || getAccessTokenFromCookie(event.headers.Cookie);

  const clientData = querystring.parse(event.body);
  console.log(clientData);

  clientData.client_type = "individual";
  clientData.email = clientData.username;
  clientData.metadata = JSON.parse(clientData.metadata);

  try {
    const clientRes = await httpClient(ACCESS_TOKEN).post("/client", {
      body: clientData
    });

    const clientId = clientRes.body.client.id;

    const [taxAdvantagedAcc, taxableAcc] = await Promise.all([
      createAccount(clientId, ACC_TYPE_TAX_ADVANTAGED),
      createAccount(clientId, ACC_TYPE_TAXABLE)
    ]);

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Need to properly set origin to receive response!
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        client: res.body
      })
    };

    callback(null, response);
  } catch (error) {
    const response = {
      statusCode: error.statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        message: error.statusMessage
      })
    };

    callback(null, response);
  }
}

export async function getRecommendedPortfolio(event, context, callback) {
  ACCESS_TOKEN = ACCESS_TOKEN || getAccessTokenFromCookie(event.headers.Cookie);
  // use querystring! to parse 'foo=bar&abc=xyz&abc=123' to JS object!!
  const surveyResults = querystring.parse(event.body);
  const totalRiskScore = Object.values(surveyResults).reduce(
    (accumulator, currentVal) => +accumulator + +currentVal,
    0
  );

  const riskToleranceLevelType = getRiskToleranceLevelType(totalRiskScore);
  const allocationId = getAllocationId(
    surveyResults.age,
    riskToleranceLevelType
  );

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
      {}
    );

    // Grab model's holdings and its details
    const [modelHoldingsResponse, allocationResponse] = await Promise.all([
      fetchModelHolding(Object.keys(allocCompoObj)),
      fetchAllocation(allocationId)
    ]);

    // Grab all security's id and put in an array
    const securitiesArr = modelHoldingsResponse.body.content.reduce(
      (acc, curr) => {
        const {
          security_id: securityId,
          strategic_weight: weight,
          model_id: modelId
        } = curr;
        const assetWeight = Math.round(
          (allocCompoObj[modelId].weight / 100) * weight
        );
        acc[securityId] = { weight: assetWeight };
        return acc;
      },
      {}
    );

    // Get details of the securities
    const securityRequestConfig = {
      query: {
        filter: `id==${Object.keys(securitiesArr).join(",id==")}`
      }
    };
    const securitiesRes = await httpClient(ACCESS_TOKEN)(
      "/security",
      securityRequestConfig
    );

    // Add more details
    const holdingsArr = securitiesRes.body.content.map(security => ({
      ...securitiesArr[security.id],
      ...{
        name: security.name,
        ticker: security.ticker,
        assetClass: security.asset_class
      }
    }));

    // when traslate /allocation_composition's weight
    // to model's weight don't add up to 100 (percent)
    roundValuesUpToTarget({
      source: holdingsArr,
      target: 100,
      accessorKey: "weight"
    });

    // Sort by holding's weight
    const results = sortArrayByDesc(holdingsArr, "weight");

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Need to properly set origin to receive response!
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        holdings: results,
        portfolio: allocationResponse.body
      })
    };

    callback(null, response);
  } catch (error) {
    const response = {
      statusCode: error.statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        message: error.statusMessage
      })
    };

    callback(null, response);
  }
}
