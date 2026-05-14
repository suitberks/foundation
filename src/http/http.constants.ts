// HTTP status codes that we will use to determine successful and exceptional responses from the API.
// More about the values: https://i.pinimg.com/originals/2c/0c/43/2c0c43e5bacbdb5f1ed7d18bf4ced2e7.jpg

export const SUCCESS_STATUS_CODES = [200, 201, 202, 307] as const;
export const EXCEPTION_STATUS_CODES = [400, 401, 403, 404, 405, 409, 500] as const;
