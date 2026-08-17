ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS original_code text;
COMMENT ON COLUMN public.inventory_items.sku IS 'Código loja';
COMMENT ON COLUMN public.inventory_items.original_code IS 'Código original (fabricante)';