import got from "got";
import {
  buildSuccessResponse,
  buildFailureResponse
} from "../libs/response-lib";

const OAUTH_URL =
  "https://sandbox.hydrogenplatform.com/authorization/v1/oauth/token?grant_type=client_credentials";

export async function getAccessToken(event, context, callback) {
  const { SANDBOX_ATOM_CLIENT_ID, SANDBOX_ATOM_CLIENT_SECRET } = process.env;

  const bufferCredential = Buffer.from(
    `${SANDBOX_ATOM_CLIENT_ID}:${SANDBOX_ATOM_CLIENT_SECRET}`
  );
  const base64Credential = bufferCredential.toString("base64");

  const requestConfig = {
    method: "POST",
    json: true,
    headers: { Authorization: `Basic ${base64Credential}` }
  };

  try {
    const res = await got(OAUTH_URL, requestConfig);

    const response = buildSuccessResponse(
      res.statusCode,
      { loggedIn: true },
      { "Set-Cookie": `access_token=${res.body.access_token}; HttpOnly; ` }
    );

    return callback(null, response);
  } catch (error) {
    const response = buildFailureResponse(error);

    return callback(null, response);
  }
}
