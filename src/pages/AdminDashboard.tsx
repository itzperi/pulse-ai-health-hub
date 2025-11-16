import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Calendar, DollarSign, FileText, Users, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const todayAppointments = mockAppointments.filter(
    apt => apt.date === new Date().toISOString().split('T')[0]
  );

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Appointments"
            value={todayAppointments.length}
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
              {mockDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>{doctor.appointments}</TableCell>
                  <TableCell>
                    <Badge variant={doctor.available ? 'default' : 'secondary'}>
                      {doctor.available ? 'Available' : 'Busy'}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{(doctor.appointments * 500).toLocaleString()}</TableCell>
                </TableRow>
              ))}
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
              {todayAppointments.map((apt) => (
                <TableRow key={apt.id} className={apt.urgent ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-medium">{apt.time}</TableCell>
                  <TableCell>
                    {apt.patientName}
                    {apt.urgent && <Badge variant="destructive" className="ml-2">Urgent</Badge>}
                  </TableCell>
                  <TableCell>{apt.doctorName}</TableCell>
                  <TableCell>
                    <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{apt.currentStage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
