-- =============================================
-- SkyTicket Seed Data
-- =============================================

-- Airports
INSERT INTO public.airports (code, name, city, country) VALUES
  ('CGK', 'Bandara Internasional Soekarno-Hatta', 'Jakarta', 'Indonesia'),
  ('DPS', 'Bandara Internasional Ngurah Rai', 'Bali', 'Indonesia'),
  ('SUB', 'Bandara Internasional Juanda', 'Surabaya', 'Indonesia'),
  ('UPG', 'Bandara Internasional Sultan Hasanuddin', 'Makassar', 'Indonesia'),
  ('KNO', 'Bandara Internasional Kualanamu', 'Medan', 'Indonesia'),
  ('JOG', 'Bandara Internasional Yogyakarta', 'Yogyakarta', 'Indonesia'),
  ('SRG', 'Bandara Internasional Ahmad Yani', 'Semarang', 'Indonesia'),
  ('BPN', 'Bandara Internasional Sultan Aji Muhammad Sulaiman', 'Balikpapan', 'Indonesia'),
  ('PLM', 'Bandara Internasional Sultan Mahmud Badaruddin II', 'Palembang', 'Indonesia'),
  ('PDG', 'Bandara Internasional Minangkabau', 'Padang', 'Indonesia');

-- Airlines
INSERT INTO public.airlines (code, name, logo_url) VALUES
  ('GA', 'Garuda Indonesia', '/airlines/garuda.png'),
  ('JT', 'Lion Air', '/airlines/lionair.png'),
  ('QG', 'Citilink', '/airlines/citilink.png'),
  ('ID', 'Batik Air', '/airlines/batikair.png'),
  ('QZ', 'AirAsia', '/airlines/airasia.png');

-- Flights (40+ flights, May-August 2026)
-- Jakarta (CGK) → Bali (DPS)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-401',
  dep.id, arr.id,
  '2026-05-15 06:00:00+07', '2026-05-15 08:30:00+07',
  150, 1250000, 'economy', 120
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-402',
  dep.id, arr.id,
  '2026-05-15 12:00:00+07', '2026-05-15 14:30:00+07',
  150, 1350000, 'economy', 95
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-403',
  dep.id, arr.id,
  '2026-05-15 18:00:00+07', '2026-05-15 20:30:00+07',
  150, 1150000, 'economy', 80
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-501',
  dep.id, arr.id,
  '2026-05-15 08:00:00+07', '2026-05-15 10:30:00+07',
  150, 2850000, 'business', 24
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-601',
  dep.id, arr.id,
  '2026-05-15 05:30:00+07', '2026-05-15 08:00:00+07',
  150, 650000, 'economy', 180
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-603',
  dep.id, arr.id,
  '2026-05-15 14:00:00+07', '2026-05-15 16:30:00+07',
  150, 720000, 'economy', 160
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QG-801',
  dep.id, arr.id,
  '2026-05-15 07:00:00+07', '2026-05-15 09:25:00+07',
  145, 580000, 'economy', 150
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QG' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QZ-701',
  dep.id, arr.id,
  '2026-05-15 09:00:00+07', '2026-05-15 11:30:00+07',
  150, 520000, 'economy', 170
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QZ' AND dep.code = 'CGK' AND arr.code = 'DPS';

-- Bali (DPS) → Jakarta (CGK)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-404',
  dep.id, arr.id,
  '2026-05-16 09:00:00+07', '2026-05-16 11:00:00+07',
  120, 1280000, 'economy', 100
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'DPS' AND arr.code = 'CGK';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-602',
  dep.id, arr.id,
  '2026-05-16 15:00:00+07', '2026-05-16 17:00:00+07',
  120, 680000, 'economy', 150
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'DPS' AND arr.code = 'CGK';

-- Jakarta (CGK) → Surabaya (SUB)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-301',
  dep.id, arr.id,
  '2026-05-20 06:30:00+07', '2026-05-20 08:00:00+07',
  90, 850000, 'economy', 130
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'SUB';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'ID-201',
  dep.id, arr.id,
  '2026-05-20 10:00:00+07', '2026-05-20 11:30:00+07',
  90, 920000, 'economy', 110
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'ID' AND dep.code = 'CGK' AND arr.code = 'SUB';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QG-301',
  dep.id, arr.id,
  '2026-05-20 14:00:00+07', '2026-05-20 15:30:00+07',
  90, 500000, 'economy', 160
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QG' AND dep.code = 'CGK' AND arr.code = 'SUB';

-- Jakarta (CGK) → Makassar (UPG)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-601',
  dep.id, arr.id,
  '2026-06-01 07:00:00+07', '2026-06-01 10:30:00+07',
  210, 1450000, 'economy', 100
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'UPG';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-801',
  dep.id, arr.id,
  '2026-06-01 13:00:00+07', '2026-06-01 16:30:00+07',
  210, 890000, 'economy', 170
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'UPG';

-- Jakarta (CGK) → Medan (KNO)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-181',
  dep.id, arr.id,
  '2026-06-10 08:00:00+07', '2026-06-10 10:30:00+07',
  150, 1350000, 'economy', 110
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'KNO';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-201',
  dep.id, arr.id,
  '2026-06-10 05:00:00+07', '2026-06-10 07:30:00+07',
  150, 750000, 'economy', 180
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'KNO';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QZ-101',
  dep.id, arr.id,
  '2026-06-10 16:00:00+07', '2026-06-10 18:30:00+07',
  150, 620000, 'economy', 160
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QZ' AND dep.code = 'CGK' AND arr.code = 'KNO';

-- Jakarta (CGK) → Yogyakarta (JOG)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-201',
  dep.id, arr.id,
  '2026-06-15 06:00:00+07', '2026-06-15 07:10:00+07',
  70, 780000, 'economy', 120
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'JOG';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'ID-301',
  dep.id, arr.id,
  '2026-06-15 11:00:00+07', '2026-06-15 12:10:00+07',
  70, 850000, 'economy', 100
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'ID' AND dep.code = 'CGK' AND arr.code = 'JOG';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QG-201',
  dep.id, arr.id,
  '2026-06-15 17:00:00+07', '2026-06-15 18:10:00+07',
  70, 520000, 'economy', 150
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QG' AND dep.code = 'CGK' AND arr.code = 'JOG';

-- Jakarta (CGK) → Semarang (SRG)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-231',
  dep.id, arr.id,
  '2026-06-20 07:30:00+07', '2026-06-20 08:40:00+07',
  70, 720000, 'economy', 110
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'SRG';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-501',
  dep.id, arr.id,
  '2026-06-20 13:00:00+07', '2026-06-20 14:10:00+07',
  70, 550000, 'economy', 170
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'SRG';

-- Jakarta (CGK) → Balikpapan (BPN)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-501B',
  dep.id, arr.id,
  '2026-07-01 08:00:00+07', '2026-07-01 11:00:00+07',
  180, 1550000, 'economy', 90
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'BPN';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-701',
  dep.id, arr.id,
  '2026-07-01 15:00:00+07', '2026-07-01 18:00:00+07',
  180, 950000, 'economy', 160
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'BPN';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-502B',
  dep.id, arr.id,
  '2026-07-01 10:00:00+07', '2026-07-01 13:00:00+07',
  180, 3200000, 'business', 20
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'BPN';

-- Jakarta (CGK) → Palembang (PLM)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-151',
  dep.id, arr.id,
  '2026-07-10 06:00:00+07', '2026-07-10 07:05:00+07',
  65, 680000, 'economy', 130
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'PLM';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QG-151',
  dep.id, arr.id,
  '2026-07-10 14:00:00+07', '2026-07-10 15:05:00+07',
  65, 480000, 'economy', 150
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QG' AND dep.code = 'CGK' AND arr.code = 'PLM';

-- Jakarta (CGK) → Padang (PDG)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-161',
  dep.id, arr.id,
  '2026-07-15 08:00:00+07', '2026-07-15 09:45:00+07',
  105, 920000, 'economy', 100
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'PDG';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-301',
  dep.id, arr.id,
  '2026-07-15 16:00:00+07', '2026-07-15 17:45:00+07',
  105, 620000, 'economy', 170
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'PDG';

-- Surabaya (SUB) → Bali (DPS)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'ID-401',
  dep.id, arr.id,
  '2026-07-20 09:00:00+07', '2026-07-20 09:50:00+07',
  50, 520000, 'economy', 140
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'ID' AND dep.code = 'SUB' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QG-401',
  dep.id, arr.id,
  '2026-07-20 15:00:00+07', '2026-07-20 15:50:00+07',
  50, 420000, 'economy', 160
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QG' AND dep.code = 'SUB' AND arr.code = 'DPS';

-- Surabaya (SUB) → Makassar (UPG)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-361',
  dep.id, arr.id,
  '2026-08-01 07:00:00+07', '2026-08-01 09:00:00+07',
  120, 980000, 'economy', 100
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'SUB' AND arr.code = 'UPG';

-- Medan (KNO) → Jakarta (CGK)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-182',
  dep.id, arr.id,
  '2026-08-05 14:00:00+07', '2026-08-05 16:30:00+07',
  150, 1380000, 'economy', 105
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'KNO' AND arr.code = 'CGK';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-202',
  dep.id, arr.id,
  '2026-08-05 06:00:00+07', '2026-08-05 08:30:00+07',
  150, 780000, 'economy', 175
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'KNO' AND arr.code = 'CGK';

-- Yogyakarta (JOG) → Bali (DPS)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'ID-501',
  dep.id, arr.id,
  '2026-08-10 10:00:00+07', '2026-08-10 11:10:00+07',
  70, 650000, 'economy', 120
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'ID' AND dep.code = 'JOG' AND arr.code = 'DPS';

-- Makassar (UPG) → Balikpapan (BPN)
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QG-601',
  dep.id, arr.id,
  '2026-08-15 08:00:00+07', '2026-08-15 09:30:00+07',
  90, 580000, 'economy', 140
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QG' AND dep.code = 'UPG' AND arr.code = 'BPN';

-- Additional June flights for variety
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-405',
  dep.id, arr.id,
  '2026-06-05 06:00:00+07', '2026-06-05 08:30:00+07',
  150, 1180000, 'economy', 115
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-605',
  dep.id, arr.id,
  '2026-06-05 20:00:00+07', '2026-06-05 22:30:00+07',
  150, 580000, 'economy', 185
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'ID-101',
  dep.id, arr.id,
  '2026-06-05 09:00:00+07', '2026-06-05 11:30:00+07',
  150, 1050000, 'economy', 100
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'ID' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-503',
  dep.id, arr.id,
  '2026-06-05 08:00:00+07', '2026-06-05 10:30:00+07',
  150, 3100000, 'business', 22
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';

-- Additional July flights
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-407',
  dep.id, arr.id,
  '2026-07-25 06:30:00+07', '2026-07-25 09:00:00+07',
  150, 1320000, 'economy', 100
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'QZ-703',
  dep.id, arr.id,
  '2026-07-25 11:00:00+07', '2026-07-25 13:30:00+07',
  150, 550000, 'economy', 165
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'QZ' AND dep.code = 'CGK' AND arr.code = 'DPS';

-- August flights
INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-409',
  dep.id, arr.id,
  '2026-08-20 07:00:00+07', '2026-08-20 09:30:00+07',
  150, 1400000, 'economy', 95
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'JT-609',
  dep.id, arr.id,
  '2026-08-20 19:00:00+07', '2026-08-20 21:30:00+07',
  150, 620000, 'economy', 175
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'JT' AND dep.code = 'CGK' AND arr.code = 'DPS';

INSERT INTO public.flights (airline_id, flight_number, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, price, seat_class, available_seats)
SELECT
  a.id, 'GA-505',
  dep.id, arr.id,
  '2026-08-20 09:00:00+07', '2026-08-20 11:30:00+07',
  150, 3500000, 'business', 18
FROM public.airlines a, public.airports dep, public.airports arr
WHERE a.code = 'GA' AND dep.code = 'CGK' AND arr.code = 'DPS';
