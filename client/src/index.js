import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';

// 👇 Import the Google OAuth Provider
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { API_URL } from './config';

// Set axios base URL for all API calls (dev and production)
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// ✅ Google Cloud Client ID for OAuth authentication
const clientId = "494969818540-sg2hassfgh6sesa9ofv4bariiv1qldfs.apps.googleusercontent.com";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
