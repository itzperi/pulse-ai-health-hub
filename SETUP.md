# PulseAI Health CRM - Setup Guide

## Initial Setup

### 1. Create Sample Users and Data

To set up demo users and sample data, call the create-sample-data edge function:

```bash
# This will create:
# - Admin user: admin@pulseai.com / 1234@
# - Doctor user: doctor@pulseai.com / 1234@
# - Pharmacy user: pharma@pulseai.com / 1234@
# - Sample doctors and medications
```

### 2. Login Credentials

After running the setup:

**Admin Portal:**
- Email: admin@pulseai.com
- Password: 1234@

**Doctor Portal:**
- Email: doctor@pulseai.com
- Password: 1234@

**Pharmacy Portal:**
- Email: pharma@pulseai.com
- Password: 1234@

**Patients:**
- Can self-signup using the "Patient Signup" tab on the login page

### 3. WhatsApp Integration

The system uses Twilio for WhatsApp notifications. Reminders are sent:
- 3 days before appointment
- 1 day before appointment
- 1 hour before appointment

To enable automatic reminders, set up a cron job to call the `schedule-appointment-reminders` function hourly.

### 4. Features

**Patient Portal:**
- ✅ Book appointments with real-time calendar
- ✅ View available doctors
- ✅ See slot availability (booked slots marked as "Taken")
- ✅ View upcoming appointments
- ✅ Real-time appointment updates

**Doctor Portal:**
- ✅ View today's patient list
- ✅ Create prescriptions with medicine autocomplete
- ✅ Search medications (type "D" to see "Dolo 650", etc.)
- ✅ Add multiple medications with dosage and instructions
- ✅ Real-time appointment notifications

**Pharmacy Portal:**
- ✅ View prescription queue
- ✅ Fulfill prescriptions
- ✅ Low stock alerts
- ✅ Real-time prescription updates

**Admin Portal:**
- ✅ View all appointments
- ✅ Monitor doctor performance
- ✅ Track revenue and statistics
- ✅ Real-time dashboard updates

### 5. Mobile Responsive

All dashboards are fully responsive and optimized for mobile devices.

### 6. Real-time Sync

The system uses Supabase realtime to sync:
- Appointment bookings and updates
- Prescription submissions
- Status changes across all portals

### 7. Security

- Row Level Security (RLS) policies enforced
- Users can only see their own data
- Double-booking prevented with unique constraints
- Auto-confirm email enabled for patient signups
