export type UserRole = 'admin' | 'doctor' | 'pharmacy' | 'patient';

export interface User {
  id: string;
  username: string;
  email?: string;
  mobile?: string;
  role: UserRole;
  name?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  visitHistory: number;
  currentStage: string;
  urgent?: boolean;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medications: Medication[];
  date: string;
  status: 'pending' | 'fulfilled' | 'partial';
}

export interface Medication {
  name: string;
  dosage: string;
  days: number;
  instructions?: string;
}

export interface DashboardStats {
  totalAppointments: number;
  totalRevenue: number;
  totalPrescriptions: number;
  activePatients: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  available: boolean;
  appointments: number;
}
