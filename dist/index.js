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

// src/hono/hono.execution.ts
import { HTTPException } from "hono/http-exception";
import { red as red2 } from "kleur";

// src/utilities/generation.utilities.ts
var DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function generateRandomString(length = 10) {
  const randomValues = crypto.getRandomValues(new Uint32Array(length));
  let result = "";
  for (let i = 0; i < length; i++) {
    result += DEFAULT_CHARACTERS[randomValues[i] % DEFAULT_CHARACTERS.length];
  }
  return result;
}

// src/utilities/logging.utilities.ts
import { blue, dim, green, red, white, yellow } from "kleur/colors";

// src/utilities/datetime.utilities.ts
import { format } from "date-fns";
import { getTimezoneOffset, toZonedTime } from "date-fns-tz";
import { ru } from "date-fns/locale";
var getZonedTime = ({ tz = "Europe/London" } = {}) => {
  return toZonedTime(/* @__PURE__ */ new Date(), tz);
};
var getUTCOffset = (date, tz) => {
  const offset = getTimezoneOffset(tz, date) / (60 * 60 * 1e3);
  return `(${offset >= 0 ? "+" : ""}${offset} UTC)`;
};
var getFormattedTime = ({ tz = "Europe/London" } = {}) => {
  const zonedTime = getZonedTime({ tz });
  return `${format(zonedTime, "HH:mm:ss")} ${getUTCOffset(zonedTime, tz)}`;
};
var getFormattedDate = ({ tz = "Europe/London", withTime = true } = {}) => {
  const zonedTime = getZonedTime({ tz });
  const pattern = withTime ? "dd.MM.yyyy HH:mm:ss" : "dd.MM.yyyy";
  const formatted = format(zonedTime, pattern);
  return `${formatted}${withTime ? ` ${getUTCOffset(zonedTime, tz)}` : ""}`;
};
var formatTime = (time, { locale = ru, tz = "Europe/London" } = {}) => {
  const zonedTime = toZonedTime(time, tz);
  return `${format(zonedTime, "HH:mm:ss, d MMMM yyyy", { locale })} ${getUTCOffset(zonedTime, tz)}`;
};

// src/utilities/logging.utilities.ts
function getColoredHTTPStatus(status) {
  const colorMap = [
    { range: [200, 299], colorFn: green },
    { range: [400, 499], colorFn: yellow },
    { range: [500, 599], colorFn: red }
  ];
  const statusColor = colorMap.find(({ range: [min, max] }) => status >= (min || 0) && status <= (max || 600));
  return statusColor ? statusColor.colorFn : (text) => text;
}
function writeLog(message, level, service = "log", stack) {
  const logColorMap = { info: blue, warn: yellow, error: red };
  const timestamp = dim(getFormattedTime());
  const serviceName = logColorMap[level](service).padEnd(18);
  const formattedMessage = white(message);
  console.log(`[${timestamp}] ${serviceName} | ${formattedMessage}`);
  if (stack)
    console.log(`[${timestamp}] ${red("\u21B3 trace").padEnd(18)} | ${dim(stack)}`);
}
var log = {
  info: (message, service) => writeLog(message, "info", service),
  warn: (message, service) => writeLog(message, "warn", service),
  error: (message, service, stack) => writeLog(message, "error", service, stack)
};

// src/hono/hono.execution.ts
function proceedUnhandledError(error) {
  const errorId = generateRandomString(6);
  const errorMessage = error instanceof Error ? error.message + error.stack : JSON.stringify(error);
  log.error(`Unhandled error: ${red2(errorMessage)}`, errorId);
  return failure({ status: 500, error: `Internal server error | ${errorId}` });
}
var onHandlerError = (error, c) => {
  let response;
  if (error instanceof HTTPException && error.status < 500) {
    response = failure({ status: error.status, error: error.message });
  } else
    response = proceedUnhandledError(error);
  return c.json(response, response.status);
};

// src/hono/hono.respond.ts
function respond(c, options) {
  return c.json(success({ status: options.status, data: options.data ?? {} }), options.status);
}

// src/utilities/execution.utilities.ts
async function safeExecute(fn, onError) {
  try {
    return await fn();
  } catch (err) {
    if (onError)
      return await onError(err);
    throw err;
  }
}

// src/utilities/serialization.utilities.ts
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
  formatTime,
  generateRandomString,
  getColoredHTTPStatus,
  getFormattedDate,
  getFormattedTime,
  getUTCOffset,
  getZonedTime,
  log,
  onHandlerError,
  respond,
  safeExecute,
  success
};
