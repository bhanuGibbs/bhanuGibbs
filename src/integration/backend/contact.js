import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_BASE || '/api';

export async function submitContactForm(data) {
  const response = await axios.post(`${API_BASE}/contact/submit`, data);
  return response.data;
}
