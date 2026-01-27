import axios from 'axios';

// API base URL: 本番環境では環境変数から取得、ローカル開発ではViteプロキシを使用
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // セッションCookieをリクエストに含める
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add authentication token here later
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
