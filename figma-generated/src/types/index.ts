// API Response Types
export interface ServiceMenu {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export interface Slot {
  id: number;
  serviceMenuId: number;
  serviceMenuName: string;
  startTime: string;  // ISO 8601形式
  endTime: string;    // ISO 8601形式
  status: string;     // "AVAILABLE", "RESERVED", "FULL"
  capacity: number;
}

export interface User {
  userId: number;
  email: string;
  name: string;
  role: string;  // "USER", "STAFF"
}

export interface Reservation {
  id: number;
  userId: number;
  userName: string;
  slotId: number;
  serviceMenuId: number;
  serviceMenuName: string;
  startTime: string;
  endTime: string;
  status: string;  // "CONFIRMED", "CANCELLED"
  notes?: string;
  googleCalendarEventId?: string;
}

// Request Types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ServiceMenuRequest {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export interface SlotRequest {
  serviceMenuId: number;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface ReservationRequest {
  slotId: number;
  notes?: string;
}

// Error Response Type
export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  status: number;
  fieldErrors?: Record<string, string>;
}
