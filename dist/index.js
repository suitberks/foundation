// src/api/http.constants.ts
var SUCCESS_STATUS_CODES = [200, 201, 202, 307];
var EXCEPTION_STATUS_CODES = [400, 401, 403, 404, 405, 409, 500];

// src/api/http.factory.ts
function success({ status, data }) {
  return { kind: "data", status, data };
}
function failure({ status, error }) {
  return { kind: "error", status, error };
}

// src/api/http.resolvers.ts
async function fetchSafely(fetcher) {
  const response = await fetcher();
  if (response.kind === "error")
    return { error: new Error(response.error), data: null };
  return { error: null, data: response.data };
}
async function fetchAndThrow(fetcher) {
  const response = await fetcher();
  if (response.kind === "error")
    throw new Error(response.error);
  return response.data;
}
export {
  EXCEPTION_STATUS_CODES,
  SUCCESS_STATUS_CODES,
  failure,
  fetchAndThrow,
  fetchSafely,
  success
};
