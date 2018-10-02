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
export function buildSuccessResponse(statusCode = 200, body, headers) {
  return buildResponse(statusCode, body, headers);
}

export function buildFailureResponse(error, headers) {
  console.log(error); // debug error
  return buildResponse(
    error.statusCode,
    { message: error.statusMessage },
    headers
  );
}
