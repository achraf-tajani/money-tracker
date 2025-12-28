-- Add devise column to cycles_mensuels table
-- This migration adds support for multiple currencies (EUR, USD, MAD)

ALTER TABLE cycles_mensuels
ADD COLUMN IF NOT EXISTS devise VARCHAR(3) DEFAULT 'EUR' CHECK (devise IN ('EUR', 'USD', 'MAD'));

-- Add comment to column
COMMENT ON COLUMN cycles_mensuels.devise IS 'Currency for the cycle: EUR (Euro), USD (Dollar), or MAD (Dirham)';
