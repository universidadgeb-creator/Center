-- =========================================================================
-- Datos de prueba para Concentrado · Leads
-- =========================================================================
-- Los "socios" ya llegan de verdad vía el sync de Google Form. La tabla
-- `leads` no tiene una fuente externa todavía, así que este script siembra
-- prospectos y metas ficticias para poder ver y probar la pantalla
-- Concentrado · Leads con datos reales de forma, RP, estrategia y estado.
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- (mismo flujo que supabase/schema.sql en SETUP.md). Es seguro correrlo
-- sobre una base ya desplegada: solo agrega filas nuevas a `leads` y
-- `lead_goals`, no toca `members` ni `comments`.
--
-- Para quitar estos datos de prueba más adelante (antes de ir a producción
-- con datos reales), todas las filas de leads llevan el prefijo "[DEMO] "
-- en `comentarios`, así que basta con:
--   delete from leads where comentarios like '[DEMO]%';
--   delete from lead_goals where rp in ('', 'Andrea Torres', 'Mauricio Delgado', 'Fernanda López')
--     and month in (to_char(current_date, 'YYYY-MM'), to_char(current_date - interval '1 month', 'YYYY-MM'));
-- =========================================================================

-- ---- Metas del mes en curso y del mes anterior ----
insert into lead_goals (month, rp, meta_altas) values
  (to_char(current_date, 'YYYY-MM'), '', 25),
  (to_char(current_date, 'YYYY-MM'), 'Andrea Torres', 10),
  (to_char(current_date, 'YYYY-MM'), 'Mauricio Delgado', 8),
  (to_char(current_date, 'YYYY-MM'), 'Fernanda López', 7),
  (to_char(current_date - interval '1 month', 'YYYY-MM'), '', 20),
  (to_char(current_date - interval '1 month', 'YYYY-MM'), 'Andrea Torres', 8),
  (to_char(current_date - interval '1 month', 'YYYY-MM'), 'Mauricio Delgado', 7),
  (to_char(current_date - interval '1 month', 'YYYY-MM'), 'Fernanda López', 5)
on conflict (month, rp) do nothing;

-- ---- Leads del mes en curso ----
insert into leads (fecha_asignacion, estrategia, rp, nombre, telefono, status, tour, fecha_cita, app_downloaded, fecha_cierre, comentarios) values
  (date_trunc('month', current_date)::date + 1,  'FB',              'Andrea Torres',    'Karla Jiménez',   '55 1122 3344', 'Nuevo',                      false, null,                                        false, null,                                 '[DEMO] Escribió por Facebook Ads.'),
  (date_trunc('month', current_date)::date + 3,  'IG',              'Andrea Torres',    'Diego Ramírez',   '55 2233 4455', '10% Contactado',             false, null,                                        false, null,                                 '[DEMO] Contactado, sin respuesta aún.'),
  (date_trunc('month', current_date)::date + 5,  'WHATSAPP',        'Andrea Torres',    'Paola Nuñez',     '55 3344 5566', '50% Cita',                    false, date_trunc('month', current_date)::date + 12, false, null,                                 '[DEMO] Cita agendada para tour.'),
  (date_trunc('month', current_date)::date + 6,  'RECOMENDADO',     'Andrea Torres',    'Iván Castañeda',  '55 4455 6677', '60% Tour/Precio',             true,  date_trunc('month', current_date)::date + 6,  false, null,                                 '[DEMO] Tomó tour, evaluando precio.'),
  (date_trunc('month', current_date)::date + 2,  'PAGINA WEB',      'Andrea Torres',    'Renata Solís',    '55 5566 7788', '100% Venta',                  true,  date_trunc('month', current_date)::date + 4,  true,  date_trunc('month', current_date)::date + 9, '[DEMO] Cerrada, falta vincular con alta en Portal Admin.'),
  (date_trunc('month', current_date)::date + 1,  'VOLANTEO',        'Mauricio Delgado', 'Héctor Villaseñor','55 6677 8899', 'Nuevo',                      false, null,                                        false, null,                                 '[DEMO] Volanteo zona Naciones Unidas.'),
  (date_trunc('month', current_date)::date + 4,  'FB',              'Mauricio Delgado', 'Brenda Ortega',   '55 7788 9900', '20% Contactado con respuesta', false, null,                                       false, null,                                 '[DEMO] Respondió, pidió info de horarios.'),
  (date_trunc('month', current_date)::date + 8,  'ESPECTACULAR',    'Mauricio Delgado', 'Luis Fernando Paz','55 8899 0011', '80% Por confirmar',           true,  date_trunc('month', current_date)::date + 8,  false, null,                                 '[DEMO] Tour listo, esperando confirmar fecha de alta.'),
  (date_trunc('month', current_date)::date + 3,  'IG',              'Mauricio Delgado', 'Sofía Beltrán',   '55 9900 1122', '0% No le interesa',           false, null,                                        false, date_trunc('month', current_date)::date + 5, '[DEMO] Ya tiene membresía en otro gym.'),
  (date_trunc('month', current_date)::date + 7,  'WHATSAPP',        'Fernanda López',   'Emiliano Cruz',   '55 0011 2233', '50% Reprogramar cita',        false, date_trunc('month', current_date)::date + 14, false, null,                                '[DEMO] Reprogramó cita para la próxima semana.'),
  (date_trunc('month', current_date)::date + 3,  'RECOMENDADO',     'Fernanda López',   'Ximena Rangel',   '55 1234 5678', '100% Venta',                  true,  date_trunc('month', current_date)::date + 5,  true,  date_trunc('month', current_date)::date + 10,'[DEMO] Cerrada, referida por socio actual.');

-- ---- Leads del mes anterior (para probar el selector de mes y metas históricas) ----
insert into leads (fecha_asignacion, estrategia, rp, nombre, telefono, status, tour, fecha_cita, app_downloaded, fecha_cierre, comentarios) values
  (date_trunc('month', current_date - interval '1 month')::date + 2,  'FB',           'Andrea Torres',    'Mariana Cordero',  '55 2345 6789', '100% Venta',              true, date_trunc('month', current_date - interval '1 month')::date + 4, true, date_trunc('month', current_date - interval '1 month')::date + 8,  '[DEMO] Cerrada mes pasado.'),
  (date_trunc('month', current_date - interval '1 month')::date + 9,  'IG',           'Andrea Torres',    'Rodrigo Salcido',  '55 3456 7890', 'Nunca contestó',         false, null,                                                              false, null,                                                                '[DEMO] No contestó llamadas ni WhatsApp.'),
  (date_trunc('month', current_date - interval '1 month')::date + 4,  'WHATSAPP',     'Mauricio Delgado', 'Cynthia Robles',   '55 4567 8901', '100% Venta',              true, date_trunc('month', current_date - interval '1 month')::date + 6, true, date_trunc('month', current_date - interval '1 month')::date + 11, '[DEMO] Cerrada mes pasado.'),
  (date_trunc('month', current_date - interval '1 month')::date + 13, 'VOLANTEO',     'Mauricio Delgado', 'Óscar Medina',     '55 5678 9012', 'Llamar después',        false, null,                                                              false, null,                                                                '[DEMO] Pidió que le llamaran este mes.'),
  (date_trunc('month', current_date - interval '1 month')::date + 6,  'PAGINA WEB',   'Fernanda López',   'Valeria Chávez',   '55 6789 0123', '100% Venta',              true, date_trunc('month', current_date - interval '1 month')::date + 8, true, date_trunc('month', current_date - interval '1 month')::date + 13, '[DEMO] Cerrada mes pasado.'),
  (date_trunc('month', current_date - interval '1 month')::date + 11, 'FB',           'Fernanda López',   'Gustavo Peña',     '55 7890 1234', 'No existe',              false, null,                                                              false, date_trunc('month', current_date - interval '1 month')::date + 12, '[DEMO] Número no corresponde a nadie.'),
  (date_trunc('month', current_date - interval '1 month')::date + 5,  'RECOMENDADO',  'Andrea Torres',    'Tania Guzmán',     '55 8901 2345', 'Tiene total pass',       false, null,                                                              false, null,                                                                '[DEMO] Ya cuenta con Total Pass.'),
  (date_trunc('month', current_date - interval '1 month')::date + 10, 'ESPECTACULAR', 'Mauricio Delgado', 'Fabián Rico',      '55 9012 3456', 'Pase invitado Easy Fit', false, null,                                                              false, null,                                                                '[DEMO] Vino con pase de invitado.');
