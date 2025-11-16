import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Calendar, Clock, FileText, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockDoctors, mockAppointments } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientDashboard() {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const myAppointments = mockAppointments.filter(apt => apt.patientId === user?.id);
  const upcomingAppointments = myAppointments.filter(apt => apt.status !== 'completed');

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Appointment Booked!',
      description: 'You will receive a WhatsApp confirmation shortly'
    });

    setSelectedDoctor('');
    setSelectedDate('');
    setSelectedTime('');
  };

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  return (
    <DashboardLayout title="Patient Portal">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Upcoming Appointments" value={upcomingAppointments.length} icon={Calendar} />
          <StatCard title="Total Visits" value={myAppointments.length} icon={Clock} />
          <StatCard title="Prescriptions" value={5} icon={FileText} />
          <StatCard title="Last Visit" value="3 days ago" icon={User} />
        </div>

        {/* Book Appointment */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Book New Appointment</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Book Appointment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Your Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Doctor</Label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockDoctors.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id} disabled={!doc.available}>
                            {doc.name} - {doc.specialization}
                            {!doc.available && ' (Unavailable)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Select Date</Label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-md"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label>Select Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleBookAppointment} className="w-full">
                    Confirm Booking
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {mockDoctors.map((doctor) => (
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
                <p className="text-xs text-muted-foreground">
                  {doctor.appointments} appointments today
                </p>
              </Card>
            ))}
          </div>
        </Card>

        {/* My Appointments */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">My Appointments</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell>{new Date(apt.date).toLocaleDateString()}</TableCell>
                    <TableCell>{apt.time}</TableCell>
                    <TableCell>{apt.doctorName}</TableCell>
                    <TableCell>
                      <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                        {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Reschedule</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No upcoming appointments. Book one now!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
