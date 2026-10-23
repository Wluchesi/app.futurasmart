-- ========================================================
-- Futura Smart - Esquema SQL para o Supabase
-- Execute este script no SQL Editor do seu painel Supabase
-- ========================================================

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  whatsapp TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Placas Inteligentes NFC & QR Code
CREATE TABLE IF NOT EXISTS public.plates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT DEFAULT 'Balcão',
  type TEXT DEFAULT 'google',
  destination_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  scans_total INTEGER DEFAULT 0 NOT NULL,
  scans_nfc INTEGER DEFAULT 0 NOT NULL,
  scans_qr INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Auditoria e Logs de Redirecionamento
CREATE TABLE IF NOT EXISTS public.logs (
  id TEXT PRIMARY KEY,
  plate_id TEXT REFERENCES public.plates(id) ON DELETE CASCADE,
  user_id TEXT,
  slug TEXT,
  plate_name TEXT,
  source TEXT,
  device TEXT,
  user_agent TEXT,
  target_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para alta performance de redirecionamento (< 15ms)
CREATE INDEX IF NOT EXISTS idx_plates_slug ON public.plates (slug);
CREATE INDEX IF NOT EXISTS idx_plates_user ON public.plates (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_plate ON public.logs (plate_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.logs (created_at DESC);

-- Desativar RLS para permitir que o backend Express realize as operações
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;

-- 4. Inserir Administrador Principal (Super Admin)
INSERT INTO public.users (id, name, email, whatsapp, password, role)
VALUES (
  'usr-admin-01',
  'W Luchesi',
  'wluchesi@gmail.com',
  '(11) 99999-9999',
  'C@n@l4141',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'admin';

-- 5. Inserir Placas de Exemplo Iniciais
INSERT INTO public.plates (id, user_id, slug, name, location, type, destination_url, is_active, scans_total, scans_nfc, scans_qr)
VALUES
  ('plk-g101', 'usr-admin-01', 'barbearia-vintage', 'Barbearia Vintage Club', 'Balcão Recepção', 'google', 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4', true, 142, 89, 53),
  ('plk-g102', 'usr-admin-01', 'pizzaria-bella-mesa1', 'Pizzaria Bella Napoli', 'Mesa 01', 'google', 'https://g.page/r/CbG9x7xL8mK-EAI/review', true, 98, 64, 34),
  ('plk-g103', 'usr-admin-01', 'clinica-sorriso-saude', 'Clínica Odonto Sorriso', 'Atendimento', 'google', 'https://g.page/r/CS91a2x98yZaEAI/review', true, 67, 45, 22),
  ('plk-g104', 'usr-admin-01', 'studio-glam-insta', 'Studio Glam Estética', 'Espelho', 'instagram', 'https://instagram.com/studioglam.estetica', true, 41, 29, 12)
ON CONFLICT (slug) DO NOTHING;
