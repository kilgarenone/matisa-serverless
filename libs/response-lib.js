function buildResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      ...headers
    },
    body: JSON.stringify(body)
  };
}
export function success(statusCode = 200, body, headers) {
  return buildResponse(statusCode, body, headers);
}

export function failure(statusCode = 500, body, headers) {
  return buildResponse(statusCode, body, headers);
}
