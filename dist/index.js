// src/http/http.constants.ts
var SUCCESS_STATUS_CODES = [200, 201, 202, 307];
var EXCEPTION_STATUS_CODES = [400, 401, 403, 404, 405, 409, 500];

// src/http/http.factory.ts
function success({ status, data }) {
  return { kind: "data", status, data };
}
function failure({ status, error }) {
  return { kind: "error", status, error };
}

// src/http/http.resolvers.ts
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

// src/hono/hono.respond.ts
function respond(c, options) {
  return c.json(success({ status: options.status, data: options.data ?? {} }), options.status);
}

// src/utilities/serialize.utilities.ts
import { z } from "zod";
var asQueryNumber = (schema) => z.preprocess((v) => typeof v === "string" ? Number(v) : v, schema);
var asQueryBoolean = (schema) => {
  const POSITIVE_VALUES = ["1", "true", "yes", "y", "on"];
  const NEGATIVE_VALUES = ["0", "false", "no", "n", "off"];
  return z.preprocess((value) => {
    if (typeof value === "boolean")
      return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (POSITIVE_VALUES.includes(normalized))
        return true;
      if (NEGATIVE_VALUES.includes(normalized))
        return false;
    }
    return value;
  }, schema);
};
export {
  EXCEPTION_STATUS_CODES,
  SUCCESS_STATUS_CODES,
  asQueryBoolean,
  asQueryNumber,
  failure,
  fetchAndThrow,
  fetchSafely,
  respond,
  success
};
