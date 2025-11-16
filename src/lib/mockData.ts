import { Appointment, Prescription, Doctor } from './types';

export const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'patient-1',
    patientName: 'John Smith',
    doctorId: '2',
    doctorName: 'Dr. Sarah Johnson',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    status: 'confirmed',
    visitHistory: 3,
    currentStage: 'Follow-up consultation',
    urgent: true
  },
  {
    id: 'apt-2',
    patientId: 'patient-2',
    patientName: 'Emily Davis',
    doctorId: '2',
    doctorName: 'Dr. Sarah Johnson',
    date: new Date().toISOString().split('T')[0],
    time: '11:30 AM',
    status: 'confirmed',
    visitHistory: 1,
    currentStage: 'Initial consultation'
  },
  {
    id: 'apt-3',
    patientId: 'patient-3',
    patientName: 'Michael Brown',
    doctorId: '2',
    doctorName: 'Dr. Sarah Johnson',
    date: new Date().toISOString().split('T')[0],
    time: '02:00 PM',
    status: 'pending',
    visitHistory: 5,
    currentStage: 'Treatment review'
  }
];

export const mockPrescriptions: Prescription[] = [
  {
    id: 'prx-1',
    appointmentId: 'apt-1',
    patientId: 'patient-1',
    patientName: 'John Smith',
    doctorId: '2',
    doctorName: 'Dr. Sarah Johnson',
    medications: [
      { name: 'Dolo 650', dosage: '1 tablet', days: 5, instructions: 'After meals' },
      { name: 'Amoxicillin', dosage: '500mg', days: 7, instructions: 'Before meals' }
    ],
    date: new Date().toISOString().split('T')[0],
    status: 'pending'
  }
];

export const mockDoctors: Doctor[] = [
  {
    id: '2',
    name: 'Dr. Sarah Johnson',
    specialization: 'General Medicine',
    available: true,
    appointments: 8
  },
  {
    id: 'doc-2',
    name: 'Dr. Michael Chen',
    specialization: 'Cardiology',
    available: true,
    appointments: 5
  },
  {
    id: 'doc-3',
    name: 'Dr. Priya Sharma',
    specialization: 'Pediatrics',
    available: false,
    appointments: 0
  }
];

export const medicationSuggestions = [
  'Dolo 650',
  'Paracetamol',
  'Amoxicillin',
  'Azithromycin',
  'Ibuprofen',
  'Omeprazole',
  'Metformin',
  'Amlodipine',
  'Atorvastatin',
  'Cetirizine'
];
