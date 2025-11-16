import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
  appointmentId: string;
  type: '3days' | '1day' | '1hour';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { appointmentId, type }: ReminderRequest = await req.json();

    // Fetch appointment details
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:profiles!appointments_patient_id_fkey(name, mobile),
        doctor:doctors(name)
      `)
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      throw new Error('Appointment not found');
    }

    const { patient, doctor, appointment_date, appointment_time } = appointment;
    
    if (!patient.mobile) {
      throw new Error('Patient mobile number not found');
    }

    // Format the message based on reminder type
    let message = '';
    if (type === '3days') {
      message = `Reminder: You have an appointment in 3 days on ${appointment_date} at ${appointment_time} with Dr. ${doctor.name} at PulseAI Hospital.`;
    } else if (type === '1day') {
      message = `Reminder: You have an appointment tomorrow ${appointment_date} at ${appointment_time} with Dr. ${doctor.name} at PulseAI Hospital.`;
    } else {
      message = `Reminder: Your appointment starts in 1 hour at ${appointment_time} with Dr. ${doctor.name} at PulseAI Hospital. Reply CONFIRM to confirm or RESCHEDULE to request a new time.`;
    }

    // Send WhatsApp message via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${Deno.env.get('TWILIO_WHATSAPP_NUMBER')}`);
    formData.append('To', `whatsapp:${patient.mobile}`);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioResult);
      throw new Error(`Failed to send WhatsApp message: ${twilioResult.message}`);
    }

    // Log notification
    await supabase.from('notifications').insert({
      user_id: appointment.patient_id,
      appointment_id: appointmentId,
      type: 'reminder',
      message: message,
      status: 'sent'
    });

    console.log('WhatsApp reminder sent:', twilioResult);

    return new Response(JSON.stringify({ success: true, messageId: twilioResult.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error sending WhatsApp reminder:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});