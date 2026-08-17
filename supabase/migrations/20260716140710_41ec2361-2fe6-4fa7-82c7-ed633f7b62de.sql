
CREATE TABLE public.cash_closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  closing_date DATE NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  total_inflow NUMERIC NOT NULL DEFAULT 0,
  total_outflow NUMERIC NOT NULL DEFAULT 0,
  cash_amount NUMERIC NOT NULL DEFAULT 0,
  pix_amount NUMERIC NOT NULL DEFAULT 0,
  debit_amount NUMERIC NOT NULL DEFAULT 0,
  credit_amount NUMERIC NOT NULL DEFAULT 0,
  boleto_amount NUMERIC NOT NULL DEFAULT 0,
  transfer_amount NUMERIC NOT NULL DEFAULT 0,
  other_amount NUMERIC NOT NULL DEFAULT 0,
  os_count INTEGER NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  closed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_closings TO authenticated;
GRANT ALL ON public.cash_closings TO service_role;

ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cash closings" ON public.cash_closings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_cash_closings_updated_at
  BEFORE UPDATE ON public.cash_closings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
