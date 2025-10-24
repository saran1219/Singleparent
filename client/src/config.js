// Central place to define the API base URL for the frontend
// Uses environment variable in production; falls back to localhost for local dev
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
