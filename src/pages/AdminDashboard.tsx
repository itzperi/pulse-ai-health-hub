import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Calendar, DollarSign, FileText, Users, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(name),
          doctor:doctors(name)
        `)
        .eq('appointment_date', today)
        .order('appointment_time');

      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('*');

      setAppointments(appointmentsData || []);
      setDoctors(doctorsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayAppointments = appointments.length;

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Appointments"
            value={todayAppointments}
            icon={Calendar}
            trend="+12% from yesterday"
          />
          <StatCard
            title="Total Revenue"
            value="₹45,231"
            icon={DollarSign}
            trend="+18% this month"
          />
          <StatCard
            title="Prescriptions"
            value={15}
            icon={FileText}
            trend="+5 pending"
          />
          <StatCard
            title="Active Patients"
            value={234}
            icon={Users}
            trend="+23 this week"
          />
        </div>

        {/* Doctor Performance */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Doctor Performance Today
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => {
                const doctorAppointments = appointments.filter(
                  apt => apt.doctor_id === doctor.id
                ).length;
                return (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell>{doctorAppointments}</TableCell>
                    <TableCell>
                      <Badge variant={doctor.available ? 'default' : 'secondary'}>
                        {doctor.available ? 'Available' : 'Busy'}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{(doctorAppointments * 500).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Today's Appointments */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today's Appointment Schedule
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id} className={apt.urgent ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-medium">{apt.appointment_time}</TableCell>
                  <TableCell>
                    {apt.patient?.name}
                    {apt.urgent && <Badge variant="destructive" className="ml-2">Urgent</Badge>}
                  </TableCell>
                  <TableCell>{apt.doctor?.name}</TableCell>
                  <TableCell>
                    <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{apt.current_stage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
