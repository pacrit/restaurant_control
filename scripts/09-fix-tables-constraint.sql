-- Fix tables constraint to include all required status values
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_status_check;

-- Add the correct constraint with all status values
ALTER TABLE tables ADD CONSTRAINT tables_status_check 
CHECK (status IN ('available', 'occupied', 'reserved', 'needs_attention', 'awaiting_payment'));

-- Verify current table statuses
SELECT DISTINCT status FROM tables;

-- Update any invalid statuses to 'available'
UPDATE tables SET status = 'available' WHERE status NOT IN ('available', 'occupied', 'reserved', 'needs_attention', 'awaiting_payment');

-- Test the constraint
DO $$
BEGIN
    -- Test valid status
    UPDATE tables SET status = 'available' WHERE id = 1;
    RAISE NOTICE 'Tables constraint updated successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with tables constraint: %', SQLERRM;
END $$;
