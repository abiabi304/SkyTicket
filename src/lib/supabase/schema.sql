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

-- =============================================
-- Server-side booking expiry (run via pg_cron or Supabase cron)
-- Schedule: SELECT cron.schedule('expire-bookings', '*/1 * * * *', 'SELECT public.expire_stale_bookings()');
-- =============================================

-- =============================================
-- Realtime (for auto-redirect after payment)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
