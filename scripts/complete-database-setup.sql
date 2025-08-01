-- =====================================================
-- WASTEWISE COMPLETE DATABASE SETUP
-- =====================================================
-- This script contains ALL database functions needed for WasteWise
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- 1. CREATE ENUM TYPES
-- =====================================================

-- Enum for waste types (inorganic)
DO $$ BEGIN
    CREATE TYPE waste_type_enum AS ENUM ('plastik', 'kaca', 'logam', 'kertas', 'lainnya');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for sale item types
DO $$ BEGIN
    CREATE TYPE sale_item_type_enum AS ENUM ('Inorganic Waste', 'Maggot', 'BSF Fly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Table: waste_organic
CREATE TABLE IF NOT EXISTS waste_organic (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tanggal DATE NOT NULL,
    rt VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    jumlah_kk INTEGER NOT NULL CHECK (jumlah_kk > 0),
    jumlah_timbunan_kg FLOAT NOT NULL CHECK (jumlah_timbunan_kg >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: waste_inorganic
CREATE TABLE IF NOT EXISTS waste_inorganic (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date DATE NOT NULL,
    rt VARCHAR(50) NOT NULL,
    household_name VARCHAR(255) NOT NULL,
    waste_type waste_type_enum NOT NULL,
    weight_kg FLOAT NOT NULL CHECK (weight_kg >= 0),
    recyclable_kg FLOAT CHECK (recyclable_kg >= 0),
    non_recyclable_kg FLOAT CHECK (non_recyclable_kg >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: recyclable + non_recyclable should not exceed total weight
    CONSTRAINT check_weight_consistency 
    CHECK (
        (recyclable_kg IS NULL OR recyclable_kg <= weight_kg) AND
        (non_recyclable_kg IS NULL OR non_recyclable_kg <= weight_kg) AND
        (recyclable_kg IS NULL OR non_recyclable_kg IS NULL OR 
         (recyclable_kg + non_recyclable_kg) <= weight_kg)
    )
);

-- Table: sales
CREATE TABLE IF NOT EXISTS sales (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    sale_id VARCHAR(20) UNIQUE NOT NULL,
    date DATE NOT NULL,
    rt VARCHAR(50) NOT NULL,
    item_type sale_item_type_enum NOT NULL,
    weight_kg FLOAT NOT NULL CHECK (weight_kg > 0),
    price_per_kg NUMERIC(10,2) NOT NULL CHECK (price_per_kg > 0),
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price > 0),
    buyer VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: total_price should equal weight_kg * price_per_kg
    CONSTRAINT check_total_price 
    CHECK (ABS(total_price - (weight_kg * price_per_kg)) < 0.01)
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for waste_organic
CREATE INDEX IF NOT EXISTS idx_waste_organic_tanggal ON waste_organic(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_waste_organic_rt ON waste_organic(rt);
CREATE INDEX IF NOT EXISTS idx_waste_organic_nama ON waste_organic(nama);
CREATE INDEX IF NOT EXISTS idx_waste_organic_created_at ON waste_organic(created_at DESC);

-- Indexes for waste_inorganic  
CREATE INDEX IF NOT EXISTS idx_waste_inorganic_date ON waste_inorganic(date DESC);
CREATE INDEX IF NOT EXISTS idx_waste_inorganic_rt ON waste_inorganic(rt);
CREATE INDEX IF NOT EXISTS idx_waste_inorganic_type ON waste_inorganic(waste_type);
CREATE INDEX IF NOT EXISTS idx_waste_inorganic_household ON waste_inorganic(household_name);
CREATE INDEX IF NOT EXISTS idx_waste_inorganic_created_at ON waste_inorganic(created_at DESC);

-- Indexes for sales
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_rt ON sales(rt);
CREATE INDEX IF NOT EXISTS idx_sales_item_type ON sales(item_type);
CREATE INDEX IF NOT EXISTS idx_sales_sale_id ON sales(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON sales(buyer);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- =====================================================
-- 4. CREATE FUNCTIONS
-- =====================================================

-- Function: Generate unique sale_id
CREATE OR REPLACE FUNCTION create_new_sale_id()
RETURNS VARCHAR AS $$
DECLARE
    last_id INTEGER;
    new_sale_id VARCHAR;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    LOOP
        -- Lock the table to ensure atomicity
        LOCK TABLE sales IN EXCLUSIVE MODE;
        
        -- Get the last numeric part of sale_id
        SELECT COALESCE(
            MAX(CAST(SUBSTRING(sale_id FROM 6) AS INTEGER)), 
            0
        ) INTO last_id
        FROM sales 
        WHERE sale_id ~ '^SALE-[0-9]+$';
        
        -- Generate new sale_id with zero padding
        new_sale_id := 'SALE-' || LPAD((last_id + 1)::TEXT, 3, '0');
        
        -- Check if this ID already exists (extra safety)
        IF NOT EXISTS (SELECT 1 FROM sales WHERE sale_id = new_sale_id) THEN
            RETURN new_sale_id;
        END IF;
        
        -- Increment attempt counter
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique sale_id after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate recycling rate for analytics
CREATE OR REPLACE FUNCTION calculate_recycling_rate(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    filter_rt VARCHAR DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
    total_weight NUMERIC;
    recyclable_weight NUMERIC;
    recycling_rate NUMERIC;
BEGIN
    -- Build dynamic query based on parameters
    SELECT 
        COALESCE(SUM(weight_kg), 0),
        COALESCE(SUM(recyclable_kg), 0)
    INTO total_weight, recyclable_weight
    FROM waste_inorganic
    WHERE 
        (start_date IS NULL OR date >= start_date) AND
        (end_date IS NULL OR date <= end_date) AND
        (filter_rt IS NULL OR rt = filter_rt);
    
    -- Calculate recycling rate
    IF total_weight > 0 THEN
        recycling_rate := (recyclable_weight / total_weight) * 100;
    ELSE
        recycling_rate := 0;
    END IF;
    
    RETURN ROUND(recycling_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- Function: Get monthly statistics for analytics
CREATE OR REPLACE FUNCTION get_monthly_stats(
    months_back INTEGER DEFAULT 6,
    filter_rt VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    month_year TEXT,
    organic_weight NUMERIC,
    inorganic_weight NUMERIC,
    sales_weight NUMERIC,
    sales_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH month_series AS (
        SELECT 
            generate_series(
                date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * months_back),
                date_trunc('month', CURRENT_DATE),
                INTERVAL '1 month'
            )::DATE as month_start
    ),
    organic_stats AS (
        SELECT 
            date_trunc('month', tanggal)::DATE as month_start,
            SUM(jumlah_timbunan_kg) as total_organic
        FROM waste_organic
        WHERE 
            tanggal >= CURRENT_DATE - INTERVAL '1 month' * months_back AND
            (filter_rt IS NULL OR rt = filter_rt)
        GROUP BY date_trunc('month', tanggal)
    ),
    inorganic_stats AS (
        SELECT 
            date_trunc('month', date)::DATE as month_start,
            SUM(weight_kg) as total_inorganic
        FROM waste_inorganic
        WHERE 
            date >= CURRENT_DATE - INTERVAL '1 month' * months_back AND
            (filter_rt IS NULL OR rt = filter_rt)
        GROUP BY date_trunc('month', date)
    ),
    sales_stats AS (
        SELECT 
            date_trunc('month', date)::DATE as month_start,
            SUM(weight_kg) as total_sales_weight,
            SUM(total_price) as total_sales_revenue
        FROM sales
        WHERE 
            date >= CURRENT_DATE - INTERVAL '1 month' * months_back AND
            (filter_rt IS NULL OR rt = filter_rt)
        GROUP BY date_trunc('month', date)
    )
    SELECT 
        TO_CHAR(ms.month_start, 'Mon YYYY') as month_year,
        COALESCE(os.total_organic, 0) as organic_weight,
        COALESCE(ins.total_inorganic, 0) as inorganic_weight,
        COALESCE(ss.total_sales_weight, 0) as sales_weight,
        COALESCE(ss.total_sales_revenue, 0) as sales_revenue
    FROM month_series ms
    LEFT JOIN organic_stats os ON ms.month_start = os.month_start
    LEFT JOIN inorganic_stats ins ON ms.month_start = ins.month_start
    LEFT JOIN sales_stats ss ON ms.month_start = ss.month_start
    ORDER BY ms.month_start;
END;
$$ LANGUAGE plpgsql;

-- Function: Get waste type distribution
CREATE OR REPLACE FUNCTION get_waste_type_distribution(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    filter_rt VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    waste_type TEXT,
    total_weight NUMERIC,
    total_count BIGINT,
    avg_weight NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wi.waste_type::TEXT,
        ROUND(SUM(wi.weight_kg)::NUMERIC, 2) as total_weight,
        COUNT(*) as total_count,
        ROUND(AVG(wi.weight_kg)::NUMERIC, 2) as avg_weight
    FROM waste_inorganic wi
    WHERE 
        (start_date IS NULL OR wi.date >= start_date) AND
        (end_date IS NULL OR wi.date <= end_date) AND
        (filter_rt IS NULL OR wi.rt = filter_rt)
    GROUP BY wi.waste_type
    ORDER BY total_weight DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get sales performance by item type
CREATE OR REPLACE FUNCTION get_sales_performance(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    filter_rt VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    item_type TEXT,
    total_weight NUMERIC,
    total_revenue NUMERIC,
    total_transactions BIGINT,
    avg_price_per_kg NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.item_type::TEXT,
        ROUND(SUM(s.weight_kg)::NUMERIC, 2) as total_weight,
        ROUND(SUM(s.total_price)::NUMERIC, 2) as total_revenue,
        COUNT(*) as total_transactions,
        ROUND(AVG(s.price_per_kg)::NUMERIC, 2) as avg_price_per_kg
    FROM sales s
    WHERE 
        (start_date IS NULL OR s.date >= start_date) AND
        (end_date IS NULL OR s.date <= end_date) AND
        (filter_rt IS NULL OR s.rt = filter_rt)
    GROUP BY s.item_type
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get RT performance comparison
CREATE OR REPLACE FUNCTION get_rt_performance(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    rt TEXT,
    organic_weight NUMERIC,
    inorganic_weight NUMERIC,
    sales_weight NUMERIC,
    sales_revenue NUMERIC,
    recycling_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH rt_list AS (
        SELECT DISTINCT rt FROM waste_organic
        UNION
        SELECT DISTINCT rt FROM waste_inorganic
        UNION
        SELECT DISTINCT rt FROM sales
    ),
    organic_by_rt AS (
        SELECT 
            rt,
            SUM(jumlah_timbunan_kg) as total_organic
        FROM waste_organic
        WHERE 
            (start_date IS NULL OR tanggal >= start_date) AND
            (end_date IS NULL OR tanggal <= end_date)
        GROUP BY rt
    ),
    inorganic_by_rt AS (
        SELECT 
            rt,
            SUM(weight_kg) as total_inorganic,
            SUM(recyclable_kg) as total_recyclable
        FROM waste_inorganic
        WHERE 
            (start_date IS NULL OR date >= start_date) AND
            (end_date IS NULL OR date <= end_date)
        GROUP BY rt
    ),
    sales_by_rt AS (
        SELECT 
            rt,
            SUM(weight_kg) as total_sales_weight,
            SUM(total_price) as total_sales_revenue
        FROM sales
        WHERE 
            (start_date IS NULL OR date >= start_date) AND
            (end_date IS NULL OR date <= end_date)
        GROUP BY rt
    )
    SELECT 
        rl.rt,
        COALESCE(o.total_organic, 0) as organic_weight,
        COALESCE(i.total_inorganic, 0) as inorganic_weight,
        COALESCE(s.total_sales_weight, 0) as sales_weight,
        COALESCE(s.total_sales_revenue, 0) as sales_revenue,
        CASE 
            WHEN COALESCE(i.total_inorganic, 0) > 0 
            THEN ROUND((COALESCE(i.total_recyclable, 0) / i.total_inorganic * 100)::NUMERIC, 2)
            ELSE 0 
        END as recycling_rate
    FROM rt_list rl
    LEFT JOIN organic_by_rt o ON rl.rt = o.rt
    LEFT JOIN inorganic_by_rt i ON rl.rt = i.rt
    LEFT JOIN sales_by_rt s ON rl.rt = s.rt
    ORDER BY rl.rt;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE TRIGGERS
-- =====================================================

-- Trigger for waste_organic updated_at
DROP TRIGGER IF EXISTS update_waste_organic_updated_at ON waste_organic;
CREATE TRIGGER update_waste_organic_updated_at
    BEFORE UPDATE ON waste_organic
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for waste_inorganic updated_at
DROP TRIGGER IF EXISTS update_waste_inorganic_updated_at ON waste_inorganic;
CREATE TRIGGER update_waste_inorganic_updated_at
    BEFORE UPDATE ON waste_inorganic
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for sales updated_at
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE waste_organic ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_inorganic ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON waste_organic;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON waste_inorganic;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON sales;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON waste_organic
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON waste_inorganic
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON sales
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- =====================================================
-- 8. INSERT SAMPLE DATA
-- =====================================================

-- Sample data for waste_organic
INSERT INTO waste_organic (tanggal, rt, nama, jumlah_kk, jumlah_timbunan_kg) VALUES
('2024-01-15', 'RT 001', 'Budi Santoso', 25, 45.5),
('2024-01-16', 'RT 002', 'Siti Aminah', 30, 52.3),
('2024-01-17', 'RT 003', 'Ahmad Wijaya', 28, 48.7),
('2024-01-18', 'RT 001', 'Dewi Sartika', 22, 38.2),
('2024-01-19', 'RT 004', 'Rudi Hartono', 35, 62.8),
('2024-01-20', 'RT 002', 'Maya Sari', 27, 41.5),
('2024-02-01', 'RT 003', 'Andi Pratama', 31, 55.7),
('2024-02-02', 'RT 001', 'Lina Marlina', 26, 43.9),
('2024-02-03', 'RT 004', 'Joko Susilo', 29, 51.2),
('2024-02-04', 'RT 002', 'Rina Wati', 33, 58.4)
ON CONFLICT DO NOTHING;

-- Sample data for waste_inorganic
INSERT INTO waste_inorganic (date, rt, household_name, waste_type, weight_kg, recyclable_kg, non_recyclable_kg, notes) VALUES
('2024-01-15', 'RT 001', 'Keluarga Budi', 'plastik', 12.5, 10.0, 2.5, 'Botol plastik dan kemasan makanan'),
('2024-01-16', 'RT 002', 'Keluarga Siti', 'kertas', 8.3, 7.0, 1.3, 'Koran bekas dan kardus'),
('2024-01-17', 'RT 003', 'Keluarga Ahmad', 'logam', 15.2, 14.0, 1.2, 'Kaleng minuman dan besi tua'),
('2024-01-18', 'RT 001', 'Keluarga Dewi', 'kaca', 6.7, 5.5, 1.2, 'Botol kaca dan pecahan kaca'),
('2024-01-19', 'RT 004', 'Keluarga Rudi', 'plastik', 18.9, 15.2, 3.7, 'Kemasan plastik berbagai jenis'),
('2024-01-20', 'RT 002', 'Keluarga Maya', 'kertas', 11.4, 9.8, 1.6, 'Majalah dan kertas bekas'),
('2024-02-01', 'RT 003', 'Keluarga Andi', 'logam', 9.8, 8.9, 0.9, 'Kaleng cat dan paku bekas'),
('2024-02-02', 'RT 001', 'Keluarga Lina', 'lainnya', 7.3, 3.2, 4.1, 'Campuran berbagai material'),
('2024-02-03', 'RT 004', 'Keluarga Joko', 'plastik', 14.6, 12.1, 2.5, 'Botol shampoo dan deterjen'),
('2024-02-04', 'RT 002', 'Keluarga Rina', 'kaca', 5.9, 4.8, 1.1, 'Toples kaca dan gelas pecah')
ON CONFLICT DO NOTHING;

-- Sample data for sales (using the function to generate sale_id)
INSERT INTO sales (sale_id, date, rt, item_type, weight_kg, price_per_kg, total_price, buyer, notes) VALUES
(create_new_sale_id(), '2024-01-20', 'RT 001', 'Inorganic Waste', 25.0, 2500, 62500, 'CV Daur Ulang Jaya', 'Campuran plastik dan kertas berkualitas baik'),
(create_new_sale_id(), '2024-01-21', 'RT 002', 'Maggot', 10.5, 15000, 157500, 'Peternak Lele Sukses', 'Maggot segar kualitas premium untuk pakan'),
(create_new_sale_id(), '2024-01-22', 'RT 003', 'BSF Fly', 2.3, 25000, 57500, 'Research Lab UNPAD', 'Lalat BSF untuk penelitian pengembangan'),
(create_new_sale_id(), '2024-01-25', 'RT 004', 'Inorganic Waste', 18.7, 2200, 41140, 'Toko Rongsok Makmur', 'Logam dan kaca pilihan'),
(create_new_sale_id(), '2024-02-01', 'RT 001', 'Maggot', 8.2, 16000, 131200, 'Peternakan Mandiri', 'Maggot organik berkualitas tinggi'),
(create_new_sale_id(), '2024-02-05', 'RT 002', 'Inorganic Waste', 32.1, 2300, 73830, 'PT Recycle Indonesia', 'Berbagai jenis sampah anorganik'),
(create_new_sale_id(), '2024-02-10', 'RT 003', 'BSF Fly', 1.8, 26000, 46800, 'Universitas Pertanian', 'Untuk riset pengolahan sampah organik'),
(create_new_sale_id(), '2024-02-15', 'RT 004', 'Maggot', 12.4, 14500, 179800, 'Koperasi Peternak', 'Maggot hasil fermentasi sampah organik')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. CREATE VIEWS FOR EASY ANALYTICS
-- =====================================================

-- View: Monthly summary statistics
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    DATE_TRUNC('month', tanggal)::DATE as month,
    'organic' as waste_category,
    SUM(jumlah_timbunan_kg) as total_weight,
    COUNT(*) as total_records,
    AVG(jumlah_timbunan_kg) as avg_weight
FROM waste_organic
GROUP BY DATE_TRUNC('month', tanggal)

UNION ALL

SELECT 
    DATE_TRUNC('month', date)::DATE as month,
    'inorganic' as waste_category,
    SUM(weight_kg) as total_weight,
    COUNT(*) as total_records,
    AVG(weight_kg) as avg_weight
FROM waste_inorganic
GROUP BY DATE_TRUNC('month', date)

ORDER BY month DESC, waste_category;

-- View: RT performance summary
CREATE OR REPLACE VIEW rt_summary AS
SELECT 
    rt,
    COUNT(DISTINCT tanggal) as active_days_organic,
    SUM(jumlah_kk) as total_households,
    SUM(jumlah_timbunan_kg) as total_organic_weight,
    AVG(jumlah_timbunan_kg) as avg_organic_per_day
FROM waste_organic
GROUP BY rt
ORDER BY rt;

-- View: Sales summary with profit analysis
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    item_type,
    COUNT(*) as total_transactions,
    SUM(weight_kg) as total_weight,
    SUM(total_price) as total_revenue,
    AVG(price_per_kg) as avg_price_per_kg,
    MIN(price_per_kg) as min_price_per_kg,
    MAX(price_per_kg) as max_price_per_kg
FROM sales
GROUP BY item_type
ORDER BY total_revenue DESC;

-- =====================================================
-- 10. FINAL VERIFICATION QUERIES
-- =====================================================

-- Test the sale_id generation function
SELECT create_new_sale_id() as new_sale_id;

-- Test analytics functions
SELECT * FROM get_monthly_stats(6);
SELECT * FROM get_waste_type_distribution();
SELECT * FROM get_sales_performance();
SELECT * FROM get_rt_performance();

-- Verify data integrity
SELECT 
    'waste_organic' as table_name,
    COUNT(*) as record_count,
    MIN(tanggal) as earliest_date,
    MAX(tanggal) as latest_date
FROM waste_organic

UNION ALL

SELECT 
    'waste_inorganic' as table_name,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM waste_inorganic

UNION ALL

SELECT 
    'sales' as table_name,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM sales;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your WasteWise database is now fully configured with:
-- ✅ All tables with proper constraints
-- ✅ Indexes for optimal performance  
-- ✅ Functions for analytics and sale_id generation
-- ✅ Triggers for automatic timestamp updates
-- ✅ Row Level Security policies
-- ✅ Sample data for testing
-- ✅ Views for easy reporting
-- ✅ Data integrity checks
-- 
-- Next steps:
-- 1. Create admin user in Supabase Auth
-- 2. Test the application
-- 3. Customize sample data as needed
-- =====================================================
