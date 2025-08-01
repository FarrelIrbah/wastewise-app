-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE waste_type_enum AS ENUM ('plastik', 'kaca', 'logam', 'kertas', 'lainnya');
CREATE TYPE sale_item_type_enum AS ENUM ('Inorganic Waste', 'Maggot', 'BSF Fly');

-- Create waste_organic table
CREATE TABLE waste_organic (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tanggal DATE NOT NULL,
    rt VARCHAR NOT NULL,
    nama VARCHAR NOT NULL,
    jumlah_kk INTEGER NOT NULL,
    jumlah_timbunan_kg FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create waste_inorganic table
CREATE TABLE waste_inorganic (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date DATE NOT NULL,
    rt VARCHAR NOT NULL,
    household_name VARCHAR NOT NULL,
    waste_type waste_type_enum NOT NULL,
    weight_kg FLOAT NOT NULL,
    recyclable_kg FLOAT,
    non_recyclable_kg FLOAT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    sale_id VARCHAR UNIQUE NOT NULL,
    date DATE NOT NULL,
    rt VARCHAR NOT NULL,
    item_type sale_item_type_enum NOT NULL,
    weight_kg FLOAT NOT NULL,
    price_per_kg NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    buyer VARCHAR,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to generate sale_id
CREATE OR REPLACE FUNCTION create_new_sale_id()
RETURNS VARCHAR AS $$
DECLARE
    last_id INTEGER;
    new_sale_id VARCHAR;
BEGIN
    -- Lock the table to ensure atomicity
    LOCK TABLE sales IN EXCLUSIVE MODE;
    
    -- Get the last numeric part of sale_id
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(sale_id FROM 6) AS INTEGER)), 
        0
    ) INTO last_id
    FROM sales 
    WHERE sale_id ~ '^SALE-[0-9]+$';
    
    -- Generate new sale_id
    new_sale_id := 'SALE-' || LPAD((last_id + 1)::TEXT, 3, '0');
    
    RETURN new_sale_id;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_waste_organic_updated_at
    BEFORE UPDATE ON waste_organic
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waste_inorganic_updated_at
    BEFORE UPDATE ON waste_inorganic
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE waste_organic ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_inorganic ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON waste_organic
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON waste_inorganic
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON sales
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO waste_organic (tanggal, rt, nama, jumlah_kk, jumlah_timbunan_kg) VALUES
('2024-01-15', 'RT 001', 'Budi Santoso', 25, 45.5),
('2024-01-16', 'RT 002', 'Siti Aminah', 30, 52.3),
('2024-01-17', 'RT 003', 'Ahmad Wijaya', 28, 48.7);

INSERT INTO waste_inorganic (date, rt, household_name, waste_type, weight_kg, recyclable_kg, non_recyclable_kg, notes) VALUES
('2024-01-15', 'RT 001', 'Keluarga Budi', 'plastik', 12.5, 10.0, 2.5, 'Botol plastik dan kemasan'),
('2024-01-16', 'RT 002', 'Keluarga Siti', 'kertas', 8.3, 7.0, 1.3, 'Koran dan kardus'),
('2024-01-17', 'RT 003', 'Keluarga Ahmad', 'logam', 15.2, 14.0, 1.2, 'Kaleng dan besi tua');

INSERT INTO sales (sale_id, date, rt, item_type, weight_kg, price_per_kg, total_price, buyer, notes) VALUES
('SALE-001', '2024-01-20', 'RT 001', 'Inorganic Waste', 25.0, 2500, 62500, 'CV Daur Ulang Jaya', 'Plastik dan kertas'),
('SALE-002', '2024-01-21', 'RT 002', 'Maggot', 10.5, 15000, 157500, 'Peternak Lele Sukses', 'Maggot kualitas premium'),
('SALE-003', '2024-01-22', 'RT 003', 'BSF Fly', 2.3, 25000, 57500, 'Research Lab UNPAD', 'Untuk penelitian');
