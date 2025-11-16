import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  available: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function AppointmentCalendar({ onBookingComplete }: { onBookingComplete?: () => void }) {
  const [date, setDate] = useState<Date>();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const { toast } = useToast();

  const allTimeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (date && selectedDoctor) {
      fetchAvailableSlots();
    }
  }, [date, selectedDoctor]);

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

  const fetchAvailableSlots = async () => {
    if (!date || !selectedDoctor) return;

    const dateStr = format(date, 'yyyy-MM-dd');

    // Fetch already booked appointments for this doctor on this date
    const { data: bookedAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', selectedDoctor)
      .eq('appointment_date', dateStr)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Error fetching appointments:', error);
      return;
    }

    const bookedTimes = bookedAppointments?.map(apt => apt.appointment_time.substring(0, 5)) || [];

    const slots = allTimeSlots.map(time => ({
      time,
      available: !bookedTimes.includes(time)
    }));

    setTimeSlots(slots);
  };

  const handleBookAppointment = async () => {
    if (!date || !selectedDoctor || !selectedTime) {
      toast({
        title: 'Please select all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Please login to book appointments',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctor,
          appointment_date: format(date, 'yyyy-MM-dd'),
          appointment_time: selectedTime + ':00',
          status: 'confirmed',
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Slot already booked',
            description: 'Please select another time',
            variant: 'destructive'
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: 'Appointment Booked!',
        description: 'You will receive WhatsApp confirmation shortly'
      });

      // Reset form
      setSelectedTime('');
      fetchAvailableSlots();
      onBookingComplete?.();

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Booking failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <Label>Select Doctor</Label>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.name} - {doc.specialization}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Select Date</Label>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
          />
        </div>

        {date && selectedDoctor && (
          <div>
            <Label>Available Time Slots</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? 'default' : 'outline'}
                  disabled={!slot.available}
                  onClick={() => setSelectedTime(slot.time)}
                  className="relative"
                >
                  {slot.time}
                  {!slot.available && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                      Taken
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleBookAppointment} 
          className="w-full"
          disabled={!date || !selectedDoctor || !selectedTime}
        >
          Confirm Booking
        </Button>
      </div>
    </Card>
  );
}