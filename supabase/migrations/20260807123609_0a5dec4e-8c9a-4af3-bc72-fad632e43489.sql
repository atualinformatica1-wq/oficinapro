CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trade_name text,
  document text,
  phone text,
  whatsapp text,
  email text,
  website text,
  contact_name text,
  address text,
  city text,
  state text,
  zip_code text,
  category text NOT NULL DEFAULT 'outros',
  payment_terms text,
  delivery_days numeric,
  status text NOT NULL DEFAULT 'ativo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO anon;
GRANT ALL ON public.suppliers TO service_role;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();