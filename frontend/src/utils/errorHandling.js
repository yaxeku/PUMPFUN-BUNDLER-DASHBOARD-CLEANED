export function getErrorMessage(error, fallback = 'Operation failed') {
  if (!error) return fallback;

  const serverError = error?.response?.data?.error;
  if (typeof serverError === 'string' && serverError.trim()) {
    return serverError;
  }

  const serverMessage = error?.response?.data?.message;
  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage;
  }

  const directMessage = error?.message;
  if (typeof directMessage === 'string' && directMessage.trim()) {
    return directMessage;
  }

  return fallback;
}

export function normalizeApiError(error, fallback = 'Request failed') {
  const message = getErrorMessage(error, fallback);
  const status = error?.response?.status || null;
  const isNetworkError = !error?.response && !!error?.request;
  const code = error?.code || null;

  return {
    message,
    status,
    isNetworkError,
    code,
    timestamp: new Date().toISOString(),
  };
}
