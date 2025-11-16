import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function SetupHelper() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSampleData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-sample-data');

      if (error) throw error;

      toast({
        title: 'Sample data created!',
        description: 'You can now login with demo credentials. Check SETUP.md for details.'
      });

      console.log('Sample data result:', data);
    } catch (error: any) {
      console.error('Error creating sample data:', error);
      toast({
        title: 'Setup failed',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">Setup Demo Data</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Click below to create sample users, doctors, and medications for testing.
      </p>
      <Button 
        onClick={createSampleData} 
        disabled={loading}
        className="w-full"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Sample Data
      </Button>
      <div className="mt-4 text-xs text-muted-foreground space-y-1">
        <p>This will create:</p>
        <ul className="list-disc list-inside ml-2">
          <li>Admin: admin@pulseai.com / 1234@</li>
          <li>Doctor: doctor@pulseai.com / 1234@</li>
          <li>Pharmacy: pharma@pulseai.com / 1234@</li>
          <li>Sample doctors and medications</li>
        </ul>
      </div>
    </Card>
  );
}
