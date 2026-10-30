export interface User {
  id: number | string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  accountStatus?: string;
  createdAt?: string;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: number;
  vehicleName: string;
  registrationNumber: string;
  batteryCapacityKwh: number;
}

export interface ChargingPoint {
  id: number;
  pointCode: string;
  connectorType: 'CCS2' | 'TYPE2' | 'GBT';
  powerKw: number;
  pricePerKwh: number;
  operationalStatus: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
  baseOperationalStatus?: string;
  intervalStatus?: string;
  isAvailableForInterval?: boolean;
}

export interface ChargingStation {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  operatingStatus: 'OPERATIONAL' | 'MAINTENANCE' | 'DECOMMISSIONED';
  openingTime: string;
  closingTime: string;
  totalPoints: number;
  availablePoints: number;
  maxPowerKw: number;
  minPricePerKwh: number;
  connectorTypes: string[];
  chargingPoints?: ChargingPoint[];
}

export interface Reservation {
  id: number;
  bookingReference: string;
  userId: number | string;
  userName?: string;
  userEmail?: string;
  chargingPointId: number;
  pointCode: string;
  connectorType: string;
  powerKw: number;
  stationId: number;
  stationName: string;
  stationAddress: string;
  vehicleName?: string;
  registrationNumber?: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  cancellationReason?: string;
  estimatedEnergyKwh: number;
  estimatedCost: number;
  createdAt: string;
}

export interface PriorityBreakdown {
  urgencyU: number;
  waitingT: number;
  reliabilityR: number;
  alpha: number;
  beta: number;
  gamma: number;
  priorityScore: number;
  waitingMinutes: number;
}

export interface WaitingListEntry {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  chargingPointId: number;
  pointCode: string;
  connectorType: string;
  powerKw: number;
  stationId: number;
  stationName: string;
  requestedStartTime: string;
  requestedEndTime: string;
  stateOfChargePercent: number;
  waitingSince: string;
  reliabilityScore: number;
  priorityScore: number;
  status: 'QUEUED' | 'ALLOCATED' | 'EXPIRED' | 'CANCELLED';
  allocatedReservationId?: number;
  createdAt: string;
  priorityBreakdown?: PriorityBreakdown;
}

export interface AdminMetrics {
  totalStations: number;
  totalChargingPoints: number;
  availableChargingPoints: number;
  activeReservations: number;
  cancelledReservations: number;
  completedReservations: number;
  noShowReservations: number;
  waitingListEntries: number;
}

