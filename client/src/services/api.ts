import {
  User,
  Vehicle,
  ChargingStation,
  Reservation,
  WaitingListEntry,
  AdminMetrics,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');

class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data?.error?.details);
  }

  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', res.data.token);
    return res.data;
  },

  async register(params: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    localStorage.setItem('token', res.data.token);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
    }
  },

  async getMe(): Promise<{ user: User }> {
    const res = await request('/auth/me');
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(params: { email: string; newPassword: string; token: string }): Promise<{ message: string }> {
    return await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    const res = await request('/users/vehicles');
    return res.data.vehicles;
  },

  async addVehicle(vehicle: { vehicleName: string; registrationNumber: string; batteryCapacityKwh: number }): Promise<Vehicle> {
    const res = await request('/users/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
    return res.data.vehicle;
  },

  async deleteVehicle(id: number): Promise<void> {
    await request(`/users/vehicles/${id}`, { method: 'DELETE' });
  },

  // Stations
  async getStations(params?: { search?: string; city?: string; connectorType?: string }): Promise<ChargingStation[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.city) query.append('city', params.city);
    if (params?.connectorType) query.append('connectorType', params.connectorType);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/stations${queryString}`);
    return res.data.stations;
  },

  async getStationById(id: number): Promise<ChargingStation> {
    const res = await request(`/stations/${id}`);
    return res.data.station;
  },

  async getStationAvailability(
    stationId: number,
    startTime: string,
    endTime: string
  ): Promise<{ chargingPoints: any[]; totalAvailable: number }> {
    const query = new URLSearchParams({ startTime, endTime });
    const res = await request(`/stations/${stationId}/availability?${query.toString()}`);
    return res.data;
  },

  // Reservations
  async createReservation(params: {
    chargingPointId: number;
    vehicleId?: number | null;
    startTime: string;
    endTime: string;
  }): Promise<Reservation> {
    const res = await request('/reservations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.data.reservation;
  },

  async getReservations(status?: string, all?: boolean): Promise<Reservation[]> {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (all) query.append('all', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/reservations${queryString}`);
    return res.data.reservations;
  },

  async getReservationById(id: number): Promise<Reservation> {
    const res = await request(`/reservations/${id}`);
    return res.data.reservation;
  },

  async cancelReservation(id: number, reason?: string): Promise<any> {
    return await request(`/reservations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async checkInReservation(id: number): Promise<any> {
    return await request(`/reservations/${id}/check-in`, { method: 'POST' });
  },

  // Waiting List
  async joinWaitingList(params: {
    chargingPointId: number;
    requestedStartTime: string;
    requestedEndTime: string;
    stateOfChargePercent: number;
  }): Promise<WaitingListEntry> {
    const res = await request('/waiting-list', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.data.entry;
  },

  async getWaitingList(chargingPointId?: number, all?: boolean): Promise<{
    entries: WaitingListEntry[];
    methodology: { formula: string; weights: any; explanation: string };
  }> {
    const query = new URLSearchParams();
    if (chargingPointId) query.append('chargingPointId', chargingPointId.toString());
    if (all) query.append('all', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/waiting-list${queryString}`);
    return res.data;
  },

  async cancelWaitingListEntry(id: number): Promise<void> {
    await request(`/waiting-list/${id}`, { method: 'DELETE' });
  },

  async simulateSlotAllocation(chargingPointId: number, startTime?: string, endTime?: string): Promise<any> {
    const res = await request('/waiting-list/simulate-allocation', {
      method: 'POST',
      body: JSON.stringify({ chargingPointId, startTime, endTime }),
    });
    return res.data;
  },

  // Admin
  async getAdminDashboard(): Promise<{
    metrics: AdminMetrics;
    recentActivity: any[];
    databaseEngine: string;
  }> {
    const res = await request('/admin/dashboard');
    return res.data;
  },

  async createStation(station: any): Promise<any> {
    const res = await request('/admin/stations', {
      method: 'POST',
      body: JSON.stringify(station),
    });
    return res.data.station;
  },

  async updateStation(id: number, station: any): Promise<any> {
    const res = await request(`/admin/stations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(station),
    });
    return res.data.station;
  },

  async addChargingPoint(stationId: number, point: any): Promise<any> {
    const res = await request(`/admin/stations/${stationId}/charging-points`, {
      method: 'POST',
      body: JSON.stringify(point),
    });
    return res.data.chargingPoint;
  },

  async updateChargingPoint(id: number, point: any): Promise<any> {
    const res = await request(`/admin/charging-points/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(point),
    });
    return res.data.chargingPoint;
  },

  async simulateNoShow(reservationId: number): Promise<any> {
    return await request(`/admin/reservations/${reservationId}/simulate-noshow`, { method: 'POST' });
  },

  async resetDemoData(): Promise<any> {
    return await request('/admin/reset-demo-data', { method: 'POST' });
  },

  async getAnalytics(): Promise<any> {
    const res = await request('/admin/analytics');
    return res.data;
  },
};

