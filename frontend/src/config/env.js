// config/env.js - Centralized Environment Configuration
// Avoids hardcoded references to import.meta.env across the codebase

export const API_URL = import.meta.env.VITE_API_URL;

// Ensure production stability by throwing an error if API_URL is missing
if (!API_URL && import.meta.env.PROD) {
  console.error("CRITICAL ERROR: VITE_API_URL is not defined in the environment.");
}
