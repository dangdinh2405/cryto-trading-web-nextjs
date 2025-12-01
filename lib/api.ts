const API_BASE_URL = `http://localhost:5001`;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor() {
    // Load access token from localStorage (refresh token is in httpOnly cookie)
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      const expiresAt = localStorage.getItem('tokenExpiresAt');
      this.tokenExpiresAt = expiresAt ? parseInt(expiresAt) : null;
    }
  }

  setTokens(accessToken: string, expiresIn: number = 3600) {
    this.accessToken = accessToken;
    // Set expiration time (current time + expiresIn seconds, minus 5 minutes buffer)
    this.tokenExpiresAt = Date.now() + (expiresIn - 300) * 1000;
    // // Set expiration time with buffer (5 minutes or half of token lifetime, whichever is smaller)
    // const bufferSeconds = Math.min(300, Math.floor(expiresIn / 2));
    // this.tokenExpiresAt = Date.now() + (expiresIn - bufferSeconds) * 1000;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('tokenExpiresAt', this.tokenExpiresAt.toString());
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenExpiresAt');
    }
  }

  getAccessToken() {
    return this.accessToken;
  }



  isTokenExpiringSoon(): boolean {
    if (!this.tokenExpiresAt) return false;
    // Check if token expires in less than 5 minutes
    return Date.now() >= this.tokenExpiresAt;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (this.accessToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      console.log("FETCH:", url, options, headers);
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // ✅ Enable cookies for refresh token
      });

      // Handle 204 No Content (e.g., logout)
      if (response.status === 204) {
        return { data: {} as T };
      }

      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, try to refresh (cookie sent automatically)
        if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry the original request
            return this.request(endpoint, options);
          }
        }

        console.error(`API Error (${endpoint}):`, data.error || 'Unknown error');
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error(`Network Error (${endpoint}):`, error);
      return { error: 'Network error. Please check your connection.' };
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ Sends cookie automatically
      });

      if (response.ok) {
        const data = await response.json();
        // Update access token (refresh token is in cookie)
        const expiresIn = data.expiresIn || 3600;
        this.setTokens(data.accessToken, expiresIn);
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Auth methods
  async register(userData: {
    FirstName: string;
    LastName: string;
    Username: string;
    Password: string;
    Email: string;
    Phone: string;
    Birthday: string;
    passkey?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(Username: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ Username, password }),
    });

    if (response.data) {
      const expiresIn = response.data.expiresIn || 3600;
      this.setTokens(response.data.accessToken, expiresIn);
      // Refresh token is in httpOnly cookie - browser handles it
    }

    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearTokens();
  }

  // User methods
  async getProfile() {
    return this.request('/user/profile');
  }

  async updateProfile(data: { username?: string; avatar?: string }) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getBalance() {
    return this.request('/user/balance');
  }

  async resetBalance() {
    return this.request('/user/balance/reset', { method: 'POST' });
  }

  async getLoginActivity() {
    return this.request('/user/login-activity');
  }

  async updateSettings(data: { timezone?: string; currency?: string; theme?: string }) {
    return this.request('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPortfolio() {
    return this.request('/user/portfolio');
  }

  async getTradeHistory() {
    return this.request('/user/trades');
  }

  // Market methods
  async getMarketPrices() {
    return this.request('/market/prices');
  }

  async getCandles(symbol: string, timeframe: string, limit = 100) {
    return this.request(`/market/candles/${symbol}/${timeframe}?limit=${limit}`);
  }

  async getOrderBook(symbol: string) {
    return this.request(`/market/orderbook/${symbol}`);
  }

  async getRecentTrades(symbol: string) {
    return this.request(`/market/trades/${symbol}`);
  }

  async getMarkets() {
    return this.request('/market/list');
  }

  // Trading methods
  async placeOrder(orderData: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    price?: number;
    amount: number;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/orders${query}`);
  }

  async cancelOrder(orderId: string) {
    return this.request(`/orders/${orderId}`, { method: 'DELETE' });
  }

  // Watchlist methods
  async getWatchlist() {
    return this.request('/user/watchlist');
  }

  async addToWatchlist(symbol: string) {
    return this.request('/user/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  }

  async removeFromWatchlist(symbol: string) {
    return this.request(`/user/watchlist/${symbol}`, { method: 'DELETE' });
  }

  // Admin methods
  async getUsers() {
    return this.request('/admin/users');
  }
}

export const api = new ApiClient();
