import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function PharmacyDashboard() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrescriptions();
    fetchLowStockMedications();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:profiles!prescriptions_patient_id_fkey(name),
          doctor:doctors(name),
          prescription_items(
            *,
            medication:medications(name)
          )
        `)
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const fetchLowStockMedications = async () => {
    try {
      const { data } = await supabase
        .from('medications')
        .select('*')
        .lt('stock_quantity', 20)
        .order('stock_quantity');

      setLowStockMeds(data || []);
    } catch (error) {
      console.error('Error fetching low stock medications:', error);
    }
  };

  const pendingCount = prescriptions.filter(p => p.status === 'pending').length;
  const fulfilledCount = prescriptions.filter(p => p.status === 'fulfilled').length;

  const handleFulfill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: 'fulfilled' })
        .eq('id', id);

      if (error) throw error;

      setPrescriptions(prescriptions.map(p => 
        p.id === id ? { ...p, status: 'fulfilled' } : p
      ));
      
      toast({
        title: 'Prescription fulfilled',
        description: 'Payment collected and medicine dispensed'
      });
    } catch (error) {
      console.error('Error fulfilling prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to fulfill prescription',
        variant: 'destructive'
      });
    }
  };

  return (
    <DashboardLayout title="Pharmacy Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pending Prescriptions" value={pendingCount} icon={Clock} />
          <StatCard title="Fulfilled Today" value={fulfilledCount} icon={CheckCircle} />
          <StatCard title="Low Stock Items" value={3} icon={AlertCircle} />
          <StatCard title="Total Revenue" value="₹12,450" icon={Package} />
        </div>

        {/* Prescription Queue */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Today's Prescription Queue</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Medications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((prx) => (
                <TableRow key={prx.id}>
                  <TableCell className="font-medium">{new Date(prx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>{prx.patient?.name}</TableCell>
                  <TableCell>{prx.doctor?.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {prx.prescription_items?.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">{item.medication?.name}</span>
                          <span className="text-muted-foreground"> - {item.dosage} × {item.days} days</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      prx.status === 'fulfilled' ? 'default' :
                      prx.status === 'pending' ? 'secondary' : 'outline'
                    }>
                      {prx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {prx.status === 'pending' && (
                      <Button size="sm" onClick={() => handleFulfill(prx.id)}>
                        Fulfill
                      </Button>
                    )}
                    {prx.status === 'fulfilled' && (
                      <span className="text-sm text-success flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Completed
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Low Stock Alert */}
        <Card className="p-6 border-warning">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {lowStockMeds.map((med) => (
              <div key={med.id} className="flex justify-between items-center p-3 bg-warning/5 rounded-lg">
                <span className="font-medium">{med.name}</span>
                <Badge variant="outline">{med.stock_quantity} units left</Badge>
              </div>
            ))}
            {lowStockMeds.length === 0 && (
              <p className="text-sm text-muted-foreground">No low stock items</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
