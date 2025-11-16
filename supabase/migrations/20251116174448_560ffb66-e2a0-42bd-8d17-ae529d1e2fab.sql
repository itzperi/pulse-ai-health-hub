-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  mobile TEXT,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'pharmacy', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  visit_history INTEGER DEFAULT 1,
  current_stage TEXT DEFAULT 'Scheduled',
  urgent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Create medications master table
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  generic_name TEXT,
  category TEXT,
  default_dosage TEXT,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'partial')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescription items table
CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id),
  dosage TEXT NOT NULL,
  days INTEGER NOT NULL,
  instructions TEXT,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications log table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'confirmation', 'reschedule', 'cancellation')),
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view doctor and admin profiles" ON public.profiles
  FOR SELECT USING (role IN ('doctor', 'admin'));

-- RLS Policies for doctors
CREATE POLICY "Anyone can view doctors" ON public.doctors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage doctors" ON public.doctors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for appointments
CREATE POLICY "Patients can view their own appointments" ON public.appointments
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view their appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Patients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update their own appointments" ON public.appointments
  FOR UPDATE USING (patient_id = auth.uid());

CREATE POLICY "Doctors can update their appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

-- RLS Policies for medications
CREATE POLICY "Everyone can view medications" ON public.medications
  FOR SELECT USING (true);

CREATE POLICY "Pharmacy can manage medications" ON public.medications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pharmacy', 'admin'))
  );

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view their prescriptions" ON public.prescriptions
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view and create prescriptions" ON public.prescriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

CREATE POLICY "Pharmacy can view and update prescriptions" ON public.prescriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pharmacy', 'admin'))
  );

-- RLS Policies for prescription items
CREATE POLICY "Users can view prescription items through prescriptions" ON public.prescription_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions 
      WHERE id = prescription_id 
      AND (patient_id = auth.uid() OR doctor_id IN (
        SELECT id FROM public.doctors WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Doctors can create prescription items" ON public.prescription_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prescriptions p
      JOIN public.doctors d ON p.doctor_id = d.id
      WHERE p.id = prescription_id AND d.user_id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample medications
INSERT INTO public.medications (name, generic_name, category, default_dosage, stock_quantity) VALUES
  ('Dolo 650', 'Paracetamol', 'Analgesic', '650mg', 500),
  ('Amoxicillin 500mg', 'Amoxicillin', 'Antibiotic', '500mg', 300),
  ('Azithromycin 500mg', 'Azithromycin', 'Antibiotic', '500mg', 200),
  ('Cetirizine 10mg', 'Cetirizine', 'Antihistamine', '10mg', 400),
  ('Omeprazole 20mg', 'Omeprazole', 'Proton Pump Inhibitor', '20mg', 350),
  ('Metformin 500mg', 'Metformin', 'Antidiabetic', '500mg', 600),
  ('Aspirin 75mg', 'Aspirin', 'Antiplatelet', '75mg', 450),
  ('Ibuprofen 400mg', 'Ibuprofen', 'NSAID', '400mg', 380),
  ('Cough Syrup', 'Dextromethorphan', 'Antitussive', '10ml', 150),
  ('Vitamin D3', 'Cholecalciferol', 'Vitamin', '1000 IU', 500);

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;