import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  signup: (email: string, password: string, name: string, mobile: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin': {
    password: '1234@',
    user: { id: '1', username: 'admin', role: 'admin', name: 'Admin User' }
  },
  'doctor': {
    password: '1234@',
    user: { id: '2', username: 'doctor', role: 'doctor', name: 'Dr. Sarah Johnson' }
  },
  'pharma': {
    password: '1234@',
    user: { id: '3', username: 'pharma', role: 'pharmacy', name: 'Pharmacy Staff' }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('pulseai_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const userRecord = MOCK_USERS[username];
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      localStorage.setItem('pulseai_user', JSON.stringify(userRecord.user));
      return true;
    }

    // Check for patient users (stored separately)
    const patientUsers = JSON.parse(localStorage.getItem('pulseai_patients') || '[]');
    const patient = patientUsers.find((p: any) => p.email === username && p.password === password);
    if (patient) {
      const patientUser: User = {
        id: patient.id,
        username: patient.email,
        email: patient.email,
        mobile: patient.mobile,
        role: 'patient',
        name: patient.name
      };
      setUser(patientUser);
      localStorage.setItem('pulseai_user', JSON.stringify(patientUser));
      return true;
    }

    return false;
  };

  const signup = (email: string, password: string, name: string, mobile: string): boolean => {
    const patientUsers = JSON.parse(localStorage.getItem('pulseai_patients') || '[]');
    
    // Check if user already exists
    if (patientUsers.find((p: any) => p.email === email)) {
      return false;
    }

    const newPatient = {
      id: `patient-${Date.now()}`,
      email,
      password,
      name,
      mobile
    };

    patientUsers.push(newPatient);
    localStorage.setItem('pulseai_patients', JSON.stringify(patientUsers));

    // Auto login after signup
    const patientUser: User = {
      id: newPatient.id,
      username: email,
      email,
      mobile,
      role: 'patient',
      name
    };
    setUser(patientUser);
    localStorage.setItem('pulseai_user', JSON.stringify(patientUser));

    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pulseai_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
