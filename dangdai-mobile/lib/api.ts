/**
 * Python Backend API Client
 *
 * This module provides a client for communicating with the Python backend API.
 * Will be implemented in later stories (Story 1-6 and beyond).
 */

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  console.warn('EXPO_PUBLIC_API_URL not configured. Python backend API will not be available.');
}

/**
 * Base URL for the Python backend API
 */
export const API_BASE_URL = apiUrl ?? 'http://localhost:8000';

/**
 * Placeholder for API client implementation
 * Will include:
 * - Quiz generation endpoints
 * - Health check
 * - Authentication headers
 */
export const api = {
  baseUrl: API_BASE_URL,
  // TODO: Implement API methods in Story 1-6
};
