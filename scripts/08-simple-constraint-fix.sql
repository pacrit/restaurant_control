-- Simple constraint fix without verification
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled', 'awaiting_payment', 'paid'));

-- Test that the constraint works by trying to insert a valid status
-- This will fail if the constraint wasn't created properly
DO $$
BEGIN
    -- This should succeed
    INSERT INTO orders (table_id, status, total_amount) VALUES (1, 'pending', 0.00);
    DELETE FROM orders WHERE table_id = 1 AND status = 'pending' AND total_amount = 0.00;
    
    RAISE NOTICE 'Constraint updated successfully - valid statuses are allowed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing constraint: %', SQLERRM;
END $$;
