const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

const readStoredToken = () => {
  if (typeof window === 'undefined') return null;

  const token = window.localStorage.getItem('quotation_backend_token');
  if (!token) return null;
  if (isTokenExpired(token)) {
    logoutUser();
    return null;
  }

  return token;
};

const storeToken = (tokenData) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('quotation_backend_token', tokenData.access_token);
  window.localStorage.setItem('quotation_backend_refresh_token', tokenData.refresh_token);
};

export const getStoredToken = () => readStoredToken();

export const getStoredRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('quotation_backend_refresh_token');
};

export const getStoredUser = () => {
  const token = readStoredToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded);

    return {
      username: parsed.username || 'Unknown user',
      email: parsed.email || 'No email available',
      role: parsed.role || 'Viewer',
      is_profile_complete: Boolean(parsed.is_profile_complete),
      expiresAt: parsed.exp ? new Date(parsed.exp * 1000).toISOString() : null,
    };
  } catch (error) {
    return null;
  }
};

export const registerUser = async ({ username, email, password, mobile_number }) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      email,
      password,
      mobile_number,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Registration failed');
  }

  return response.json();
};

export const loginUser = async ({ username, password }) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  }

  const tokenData = await response.json();
  storeToken(tokenData);
  return tokenData;
};

export const logoutUser = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('quotation_backend_token');
  window.localStorage.removeItem('quotation_backend_refresh_token');
};

export const logoutBackend = async () => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return;

  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
};

export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to fetch current user');
  }

  return response.json();
};

export const setupCompany = async ({ name, address, phone_number, email, website }) => {
  const response = await fetch(`${API_BASE}/auth/setup-company`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizedHeaders(),
    },
    body: JSON.stringify({
      name,
      address,
      phone_number,
      email,
      website,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Unable to save company details');
  }

  return response.json();
};

export const refreshAuthToken = async () => {
  if (typeof window === 'undefined') return null;

  const refreshToken = window.localStorage.getItem('quotation_backend_refresh_token');
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    logoutUser();
    return null;
  }

  const tokenData = await response.json();
  storeToken(tokenData);
  return tokenData;
};

export const getAuthorizedHeaders = () => {
  const token = readStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const resetPassword = async ({ token, new_password }) => {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, new_password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Password reset failed');
  }

  return await response.json();
};
