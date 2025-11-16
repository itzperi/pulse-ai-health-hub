import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function should be called via a cron job to check and send reminders
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Fetch appointments that need reminders
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, patient:profiles!appointments_patient_id_fkey(mobile)')
      .in('status', ['pending', 'confirmed'])
      .gte('appointment_date', now.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }

    const results = [];

    for (const appointment of appointments) {
      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      
      // Check if we need to send 3-day, 1-day, or 1-hour reminder
      const daysDiff = Math.floor((appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const hoursDiff = Math.floor((appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));

      let reminderType = null;
      
      if (daysDiff === 3) {
        reminderType = '3days';
      } else if (daysDiff === 1) {
        reminderType = '1day';
      } else if (hoursDiff === 1) {
        reminderType = '1hour';
      }

      if (reminderType) {
        // Call the send-whatsapp-reminder function
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-reminder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            appointmentId: appointment.id,
            type: reminderType
          })
        });

        results.push({
          appointmentId: appointment.id,
          reminderType,
          success: response.ok
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      reminders: results.length,
      details: results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error scheduling reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});