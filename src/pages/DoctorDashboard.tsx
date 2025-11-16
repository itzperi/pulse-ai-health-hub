import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Calendar, Clock, Users, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockAppointments, medicationSuggestions } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

export default function DoctorDashboard() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [medications, setMedications] = useState([{ name: '', dosage: '', days: 1 }]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const todayAppointments = mockAppointments.filter(
    apt => apt.date === new Date().toISOString().split('T')[0]
  );

  const filteredMedications = medicationSuggestions.filter(med =>
    med.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', days: 1 }]);
  };

  const handlePrescriptionSubmit = () => {
    toast({
      title: 'Prescription submitted',
      description: 'Prescription sent to pharmacy for processing'
    });
    setSelectedPatient(null);
    setMedications([{ name: '', dosage: '', days: 1 }]);
  };

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Today's Appointments" value={todayAppointments.length} icon={Calendar} />
          <StatCard title="Pending Patients" value={2} icon={Clock} />
          <StatCard title="Total Patients" value={45} icon={Users} />
          <StatCard title="Prescriptions" value={8} icon={FileText} />
        </div>

        {/* Today's Patients */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Today's Patient List</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Visit History</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
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
                  <TableCell>{apt.visitHistory} visits</TableCell>
                  <TableCell className="text-sm">{apt.currentStage}</TableCell>
                  <TableCell>
                    <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedPatient(apt.id)}>
                          Prescribe
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create Prescription - {apt.patientName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                          {medications.map((med, idx) => (
                            <div key={idx} className="grid grid-cols-4 gap-3 p-4 border rounded-lg">
                              <div className="col-span-4">
                                <Label>Medication</Label>
                                <Input
                                  placeholder="Type to search..."
                                  value={med.name}
                                  onChange={(e) => {
                                    const newMeds = [...medications];
                                    newMeds[idx].name = e.target.value;
                                    setMedications(newMeds);
                                    setSearchTerm(e.target.value);
                                  }}
                                />
                                {searchTerm && filteredMedications.length > 0 && (
                                  <div className="mt-2 border rounded-lg max-h-32 overflow-y-auto">
                                    {filteredMedications.map((suggestion) => (
                                      <div
                                        key={suggestion}
                                        className="p-2 hover:bg-muted cursor-pointer"
                                        onClick={() => {
                                          const newMeds = [...medications];
                                          newMeds[idx].name = suggestion;
                                          setMedications(newMeds);
                                          setSearchTerm('');
                                        }}
                                      >
                                        {suggestion}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="col-span-2">
                                <Label>Dosage</Label>
                                <Input
                                  placeholder="e.g., 1 tablet"
                                  value={med.dosage}
                                  onChange={(e) => {
                                    const newMeds = [...medications];
                                    newMeds[idx].dosage = e.target.value;
                                    setMedications(newMeds);
                                  }}
                                />
                              </div>
                              <div className="col-span-2">
                                <Label>Days</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={med.days}
                                  onChange={(e) => {
                                    const newMeds = [...medications];
                                    newMeds[idx].days = parseInt(e.target.value);
                                    setMedications(newMeds);
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                          <Button onClick={addMedication} variant="outline" className="w-full">
                            + Add Medication
                          </Button>
                          <Button onClick={handlePrescriptionSubmit} className="w-full">
                            Submit Prescription
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
