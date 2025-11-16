import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create demo users
    const users = [
      { email: 'admin@pulseai.com', password: '1234@', role: 'admin', name: 'Admin User' },
      { email: 'doctor@pulseai.com', password: '1234@', role: 'doctor', name: 'Dr. Sarah Smith' },
      { email: 'pharma@pulseai.com', password: '1234@', role: 'pharmacy', name: 'Pharmacy Staff' },
    ];

    const createdUsers = [];

    for (const userData of users) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`Error creating user ${userData.email}:`, authError);
        continue;
      }

      if (authUser.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role
          });

        if (profileError) {
          console.error(`Error creating profile for ${userData.email}:`, profileError);
        } else {
          createdUsers.push({ id: authUser.user.id, ...userData });
        }
      }
    }

    // Create doctors
    const doctorUser = createdUsers.find(u => u.role === 'doctor');
    if (doctorUser) {
      const doctors = [
        { user_id: doctorUser.id, name: 'Dr. Sarah Smith', specialization: 'General Physician', available: true },
        { user_id: null, name: 'Dr. John Doe', specialization: 'Cardiologist', available: true },
        { user_id: null, name: 'Dr. Emily Chen', specialization: 'Pediatrician', available: true },
      ];

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .insert(doctors)
        .select();

      if (doctorError) {
        console.error('Error creating doctors:', doctorError);
      } else {
        console.log('Doctors created:', doctorData);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Sample data created successfully',
      users: createdUsers.map(u => ({ email: u.email, role: u.role }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error creating sample data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});