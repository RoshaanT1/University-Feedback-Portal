/**
 * Centralized API endpoint configuration
 * All API URLs should be imported from this file for consistency and easy maintenance
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://university-feedback-portal.vercel.app';

export const API_ENDPOINTS = {
  // Department related endpoints
  DEPARTMENTS: `${API_BASE_URL}/api/departments`,
  
  // Feedback related endpoints
  FEEDBACK: `${API_BASE_URL}/api/feedback`,
  CHECK_SUBMISSIONS: `${API_BASE_URL}/api/check-submissions`,
  
  // Database initialization
  INIT_DB: `${API_BASE_URL}/api/init-db`,
} as const;

/**
 * Helper function to build URLs with query parameters
 * @param endpoint - Base endpoint URL
 * @param params - Query parameters as key-value pairs
 * @returns Complete URL with query parameters
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  if (!params) return endpoint;
  
  const url = new URL(endpoint, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  
  return url.toString();
};

/**
 * Helper function for API requests with common configuration
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export const apiRequest = async (url: string, options?: RequestInit): Promise<Response> => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
};
