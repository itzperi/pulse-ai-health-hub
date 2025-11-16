import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Calendar, Clock, FileText, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppointmentCalendar } from '@/components/AppointmentCalendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor: {
    name: string;
    specialization: string;
  };
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  available: boolean;
}

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchDoctors();
      subscribeToAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(name, specialization)
      `)
      .eq('patient_id', user?.id)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return;
    }

    setAppointments(data || []);
  };

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('available', true);

    if (error) {
      console.error('Error fetching doctors:', error);
      return;
    }

    setDoctors(data || []);
  };

  const subscribeToAppointments = () => {
    const channel = supabase
      .channel('patient-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${user?.id}`
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const upcomingAppointments = appointments.filter(
    apt => apt.status !== 'completed' && apt.status !== 'cancelled'
  );

  const totalVisits = appointments.filter(apt => apt.status === 'completed').length;

  return (
    <DashboardLayout title="Patient Portal">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Upcoming Appointments" 
            value={upcomingAppointments.length} 
            icon={Calendar} 
          />
          <StatCard 
            title="Total Visits" 
            value={totalVisits} 
            icon={Clock} 
          />
          <StatCard 
            title="Prescriptions" 
            value={appointments.filter(a => a.status === 'completed').length} 
            icon={FileText} 
          />
          <StatCard 
            title="Available Doctors" 
            value={doctors.length} 
            icon={User} 
          />
        </div>

        {/* Book Appointment */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Book New Appointment</h2>
            <Dialog open={showBooking} onOpenChange={setShowBooking}>
              <DialogTrigger asChild>
                <Button>Book Appointment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule Your Appointment</DialogTitle>
                </DialogHeader>
                <AppointmentCalendar 
                  onBookingComplete={() => {
                    setShowBooking(false);
                    fetchAppointments();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                  </div>
                  <Badge variant={doctor.available ? 'default' : 'secondary'}>
                    {doctor.available ? 'Available' : 'Busy'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* My Appointments */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">My Appointments</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        {format(new Date(apt.appointment_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {apt.appointment_time.substring(0, 5)}
                      </TableCell>
                      <TableCell>{apt.doctor.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {apt.doctor.specialization}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            apt.status === 'confirmed' ? 'default' : 
                            apt.status === 'pending' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {apt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No upcoming appointments. Book one now!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
