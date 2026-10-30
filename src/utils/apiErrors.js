const formatLimitReset = (rawDate) => {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) UTC$/.exec(rawDate || '');
  if (!match) return rawDate;

  const date = new Date(Date.UTC(
    Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]),
  ));
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
};

export const fetchApi = async (...args) => {
  try {
    return await fetch(...args);
  } catch (error) {
    if (error instanceof TypeError || error?.name === 'TypeError') {
      throw new Error('Unable to connect to the server. Check your connection and try again.');
    }
    throw error;
  }
};

export const getApiErrorMessage = (responseBody, fallback = 'Something went wrong. Please try again.') => {
  if (!responseBody) return fallback;

  let payload = responseBody;
  if (typeof responseBody === 'string') {
    try {
      payload = JSON.parse(responseBody);
    } catch {
      return responseBody;
    }
  }

  const detail = payload?.detail ?? payload?.message ?? payload?.error;
  if (typeof detail === 'string') {
    if (detail === 'Invalid credentials.') return 'Invalid username or password. Please try again.';
    const serverError = /^internal server error(?:\.\s*Reference ID:\s*([a-f0-9-]+)\.)?$/i.exec(detail.trim());
    if (serverError) {
      return serverError[1]
        ? `The server could not complete this request. Reference ID: ${serverError[1]}. Please try again shortly.`
        : 'The server could not complete this request. Please try again shortly.';
    }

    const limit = /Monthly limit of (\d+) finalized quotations\/invoices for the (.+?) plan reached\. The limit resets at (.+?)\./i.exec(detail);
    if (limit) {
      const resetDate = formatLimitReset(limit[3]);
      return `Your ${limit[2]} plan has reached its monthly limit of ${limit[1]} finalized invoices and quotations. The limit resets on ${resetDate}.`;
    }
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg || item?.message).filter(Boolean);
    return messages.length ? messages.join(' ') : fallback;
  }

  return fallback;
};

export const readApiError = async (response, fallback) => {
  let body = '';
  try {
    body = await response.text();
  } catch {
    return new Error(fallback);
  }
  return new Error(getApiErrorMessage(body, fallback));
};
