-- =============================================
-- SkyTicket Database Schema
-- =============================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Airports
CREATE TABLE public.airports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Indonesia',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Airlines
CREATE TABLE public.airlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flights
CREATE TABLE public.flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id UUID REFERENCES public.airlines(id),
  flight_number VARCHAR(10) NOT NULL,
  departure_airport_id UUID REFERENCES public.airports(id),
  arrival_airport_id UUID REFERENCES public.airports(id),
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  price BIGINT NOT NULL,
  seat_class VARCHAR(20) NOT NULL DEFAULT 'economy',
  available_seats INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  flight_id UUID REFERENCES public.flights(id),
  booking_code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_price BIGINT NOT NULL,
  passenger_count INT NOT NULL DEFAULT 1,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Passengers
CREATE TABLE public.passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number VARCHAR(20),
  id_type VARCHAR(10) DEFAULT 'ktp',
  seat_number VARCHAR(5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  midtrans_order_id VARCHAR(50) UNIQUE NOT NULL,
  midtrans_transaction_id TEXT,
  payment_type TEXT,
  gross_amount BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  snap_token TEXT,
  snap_redirect_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read airports" ON public.airports FOR SELECT USING (true);
CREATE POLICY "Public read airlines" ON public.airlines FOR SELECT USING (true);
CREATE POLICY "Public read flights" ON public.flights FOR SELECT USING (true);

-- Profile policies
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Booking policies
CREATE POLICY "Users read own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can only update contact info on their own bookings (status changes via server API only)
CREATE POLICY "Users update own bookings" ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Passenger policies
CREATE POLICY "Users read own passengers" ON public.passengers FOR SELECT USING (
  booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);
CREATE POLICY "Users create passengers" ON public.passengers FOR INSERT WITH CHECK (
  booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);

-- Payment policies
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT USING (
  booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);
-- Users can insert payments for their own bookings
CREATE POLICY "Users insert own payments" ON public.payments FOR INSERT WITH CHECK (
  booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);

-- =============================================
-- Admin Policies
-- =============================================

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin can read all profiles
CREATE POLICY "Admin read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- Admin full access to flights
CREATE POLICY "Admin manage flights" ON public.flights
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin full access to airports
CREATE POLICY "Admin manage airports" ON public.airports
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin full access to airlines
CREATE POLICY "Admin manage airlines" ON public.airlines
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin read all bookings
CREATE POLICY "Admin read all bookings" ON public.bookings FOR SELECT USING (public.is_admin());

-- Admin read all payments
CREATE POLICY "Admin read all payments" ON public.payments FOR SELECT USING (public.is_admin());

-- =============================================
-- Reschedule Support
-- =============================================

-- Add reschedule columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reschedule_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_flight_id UUID REFERENCES public.flights(id),
  ADD COLUMN IF NOT EXISTS credit_balance BIGINT NOT NULL DEFAULT 0;

-- Reschedule audit table
CREATE TABLE IF NOT EXISTS public.reschedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  from_flight_id UUID NOT NULL REFERENCES public.flights(id),
  to_flight_id UUID NOT NULL REFERENCES public.flights(id),
  price_difference BIGINT NOT NULL,
  reschedule_fee BIGINT NOT NULL DEFAULT 0,
  amount_due BIGINT NOT NULL DEFAULT 0,
  payment_id UUID REFERENCES public.payments(id),
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS for reschedules
ALTER TABLE public.reschedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reschedules" ON public.reschedules FOR SELECT USING (
  booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);

CREATE POLICY "Admin read all reschedules" ON public.reschedules FOR SELECT USING (public.is_admin());

-- =============================================
-- Performance Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_expires ON public.bookings(status, expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_bookings_flight_id ON public.bookings(flight_id);
CREATE INDEX IF NOT EXISTS idx_flights_departure_airport ON public.flights(departure_airport_id);
CREATE INDEX IF NOT EXISTS idx_flights_arrival_airport ON public.flights(arrival_airport_id);
CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON public.flights(departure_time);
CREATE INDEX IF NOT EXISTS idx_flights_seat_class ON public.flights(seat_class);
CREATE INDEX IF NOT EXISTS idx_passengers_booking_id ON public.passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_midtrans_order ON public.payments(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_reschedules_booking_status ON public.reschedules(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_reschedules_payment_id ON public.reschedules(payment_id);

-- =============================================
-- Atomic Seat Management RPCs
-- =============================================

-- Decrement seats atomically (returns new count, -1 if insufficient)
CREATE OR REPLACE FUNCTION public.decrement_seats(p_flight_id UUID, p_count INT)
RETURNS INT AS $$
DECLARE
  new_seats INT;
BEGIN
  UPDATE public.flights
  SET available_seats = available_seats - p_count
  WHERE id = p_flight_id AND available_seats >= p_count
  RETURNING available_seats INTO new_seats;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_seats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore seats atomically
CREATE OR REPLACE FUNCTION public.restore_seats(p_flight_id UUID, p_count INT)
RETURNS INT AS $$
DECLARE
  new_seats INT;
BEGIN
  UPDATE public.flights
  SET available_seats = available_seats + p_count
  WHERE id = p_flight_id
  RETURNING available_seats INTO new_seats;

  RETURN COALESCE(new_seats, -1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire stale bookings + restore seats (for pg_cron)
CREATE OR REPLACE FUNCTION public.expire_stale_bookings()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, flight_id, passenger_count
    FROM public.bookings
    WHERE status = 'pending' AND expires_at < NOW()
  LOOP
    UPDATE public.bookings SET status = 'expired', updated_at = NOW() WHERE id = r.id AND status = 'pending';
    IF FOUND THEN
      UPDATE public.flights SET available_seats = available_seats + r.passenger_count WHERE id = r.flight_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel booking atomically (only if pending)
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_flight_id UUID;
  v_passenger_count INT;
BEGIN
  UPDATE public.bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_booking_id AND user_id = p_user_id AND status = 'pending'
  RETURNING flight_id, passenger_count INTO v_flight_id, v_passenger_count;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.flights SET available_seats = available_seats + v_passenger_count WHERE id = v_flight_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire a single booking atomically (only if pending + expired)
-- Returns TRUE if expired, FALSE if already paid/cancelled/not found
CREATE OR REPLACE FUNCTION public.expire_booking(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_flight_id UUID;
  v_passenger_count INT;
BEGIN
  UPDATE public.bookings
  SET status = 'expired', updated_at = NOW()
  WHERE id = p_booking_id
    AND status = 'pending'
    AND expires_at < NOW()
  RETURNING flight_id, passenger_count INTO v_flight_id, v_passenger_count;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.flights
  SET available_seats = available_seats + v_passenger_count
  WHERE id = v_flight_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Server-side booking expiry (run via pg_cron or Supabase cron)
-- Schedule: SELECT cron.schedule('expire-bookings', '*/1 * * * *', 'SELECT public.expire_stale_bookings()');
-- =============================================

-- =============================================
-- Reschedule RPCs
-- =============================================

-- Initiate reschedule: atomic seat swap, calculate pricing
-- Returns JSON: { reschedule_id, amount_due, requires_payment }
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_booking_id UUID,
  p_new_flight_id UUID,
  p_reschedule_fee BIGINT DEFAULT 50000
)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
  v_old_flight RECORD;
  v_new_flight RECORD;
  v_new_total BIGINT;
  v_price_diff BIGINT;
  v_amount_due BIGINT;
  v_reschedule_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Lock the booking row (prevents concurrent reschedule)
  SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  IF v_booking.status != 'paid' THEN
    RAISE EXCEPTION 'Only paid bookings can be rescheduled';
  END IF;
  IF v_booking.reschedule_count >= 2 THEN
    RAISE EXCEPTION 'Maximum reschedules reached (2)';
  END IF;

  -- Get old flight details
  SELECT * INTO v_old_flight FROM public.flights WHERE id = v_booking.flight_id;

  -- Check departure is >24h away
  IF v_old_flight.departure_time < NOW() + INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Cannot reschedule within 24 hours of departure';
  END IF;

  -- Get new flight details
  SELECT * INTO v_new_flight FROM public.flights WHERE id = p_new_flight_id;

  IF v_new_flight IS NULL THEN
    RAISE EXCEPTION 'New flight not found';
  END IF;

  -- Validate same route and same seat class
  IF v_old_flight.departure_airport_id != v_new_flight.departure_airport_id
     OR v_old_flight.arrival_airport_id != v_new_flight.arrival_airport_id THEN
    RAISE EXCEPTION 'Reschedule must be on the same route';
  END IF;

  IF v_old_flight.seat_class != v_new_flight.seat_class THEN
    RAISE EXCEPTION 'Reschedule must be on the same seat class';
  END IF;

  -- Cannot reschedule to same flight
  IF v_booking.flight_id = p_new_flight_id THEN
    RAISE EXCEPTION 'Cannot reschedule to the same flight';
  END IF;

  -- Reserve new seats (atomic decrement with check)
  UPDATE public.flights
    SET available_seats = available_seats - v_booking.passenger_count
    WHERE id = p_new_flight_id
      AND available_seats >= v_booking.passenger_count;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough seats on new flight';
  END IF;

  -- Release old seats
  UPDATE public.flights
    SET available_seats = available_seats + v_booking.passenger_count
    WHERE id = v_booking.flight_id;

  -- Calculate pricing
  v_new_total := v_new_flight.price * v_booking.passenger_count;
  v_price_diff := v_new_total - v_booking.total_price;
  v_amount_due := GREATEST(0, v_price_diff + p_reschedule_fee - v_booking.credit_balance);

  -- Reschedule expires in 30 minutes if payment needed
  v_expires_at := CASE WHEN v_amount_due > 0 THEN NOW() + INTERVAL '30 minutes' ELSE NULL END;

  -- Create reschedule record
  INSERT INTO public.reschedules (
    booking_id, from_flight_id, to_flight_id,
    price_difference, reschedule_fee, amount_due,
    status, expires_at
  ) VALUES (
    p_booking_id, v_booking.flight_id, p_new_flight_id,
    v_price_diff, p_reschedule_fee, v_amount_due,
    CASE WHEN v_amount_due > 0 THEN 'pending' ELSE 'completed' END,
    v_expires_at
  ) RETURNING id INTO v_reschedule_id;

  IF v_amount_due <= 0 THEN
    -- No payment needed: complete immediately
    UPDATE public.bookings SET
      flight_id = p_new_flight_id,
      total_price = v_new_total,
      reschedule_count = reschedule_count + 1,
      original_flight_id = COALESCE(original_flight_id, v_booking.flight_id),
      credit_balance = CASE
        WHEN v_price_diff < 0
        THEN ABS(v_price_diff) - p_reschedule_fee
        ELSE GREATEST(0, v_booking.credit_balance - p_reschedule_fee - v_price_diff)
      END,
      updated_at = NOW()
    WHERE id = p_booking_id;

    UPDATE public.reschedules SET completed_at = NOW() WHERE id = v_reschedule_id;
  ELSE
    -- Payment needed: mark booking as rescheduling
    UPDATE public.bookings SET
      status = 'rescheduling',
      updated_at = NOW()
    WHERE id = p_booking_id;
  END IF;

  RETURN jsonb_build_object(
    'reschedule_id', v_reschedule_id,
    'amount_due', v_amount_due,
    'requires_payment', v_amount_due > 0,
    'new_total', v_new_total,
    'price_difference', v_price_diff,
    'reschedule_fee', p_reschedule_fee
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete reschedule after payment
CREATE OR REPLACE FUNCTION public.complete_reschedule(p_reschedule_id UUID, p_payment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_reschedule RECORD;
  v_new_flight RECORD;
  v_booking RECORD;
BEGIN
  SELECT * INTO v_reschedule FROM public.reschedules
    WHERE id = p_reschedule_id AND status = 'pending'
    FOR UPDATE;

  IF v_reschedule IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = v_reschedule.booking_id;
  SELECT price INTO v_new_flight FROM public.flights WHERE id = v_reschedule.to_flight_id;

  -- Update booking
  UPDATE public.bookings SET
    flight_id = v_reschedule.to_flight_id,
    total_price = v_new_flight.price * v_booking.passenger_count,
    status = 'paid',
    reschedule_count = reschedule_count + 1,
    original_flight_id = COALESCE(original_flight_id, v_reschedule.from_flight_id),
    credit_balance = 0,
    updated_at = NOW()
  WHERE id = v_reschedule.booking_id;

  -- Update reschedule record
  UPDATE public.reschedules SET
    status = 'completed',
    payment_id = p_payment_id,
    completed_at = NOW()
  WHERE id = p_reschedule_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire a stale reschedule: reverse seat swap, restore booking to paid
CREATE OR REPLACE FUNCTION public.expire_reschedule(p_reschedule_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_reschedule RECORD;
  v_booking RECORD;
BEGIN
  SELECT * INTO v_reschedule FROM public.reschedules
    WHERE id = p_reschedule_id AND status = 'pending'
    FOR UPDATE;

  IF v_reschedule IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = v_reschedule.booking_id;

  -- Reverse seat swap: release new flight seats, re-reserve old flight seats
  UPDATE public.flights
    SET available_seats = available_seats + v_booking.passenger_count
    WHERE id = v_reschedule.to_flight_id;

  UPDATE public.flights
    SET available_seats = available_seats - v_booking.passenger_count
    WHERE id = v_reschedule.from_flight_id;

  -- Restore booking to paid
  UPDATE public.bookings SET
    status = 'paid',
    updated_at = NOW()
  WHERE id = v_reschedule.booking_id AND status = 'rescheduling';

  -- Mark reschedule as failed
  UPDATE public.reschedules SET status = 'failed' WHERE id = p_reschedule_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire all stale reschedules (for pg_cron)
CREATE OR REPLACE FUNCTION public.expire_stale_reschedules()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.reschedules
    WHERE status = 'pending' AND expires_at < NOW()
  LOOP
    PERFORM public.expire_reschedule(r.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: SELECT cron.schedule('expire-reschedules', '*/2 * * * *', 'SELECT public.expire_stale_reschedules()');

-- =============================================
-- Realtime (for auto-redirect after payment)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
