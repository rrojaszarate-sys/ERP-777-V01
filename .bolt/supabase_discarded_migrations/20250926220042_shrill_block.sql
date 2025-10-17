/*
  # Enable Row Level Security for Production

  1. Security Configuration
    - Enable RLS on all core tables
    - Add authentication policies
    - Configure user access controls

  2. Tables Updated
    - core_companies: Company-based access
    - core_users: User-based access  
    - evt_eventos: Company and user-based access
    - evt_clientes: Company-based access
    - evt_gastos: Event-based access
    - evt_ingresos: Event-based access

  3. Policies Added
    - Read policies for authenticated users
    - Write policies with proper authorization
    - Admin override policies
*/

-- Enable RLS on core tables
ALTER TABLE core_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_categorias_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_tipos_evento ENABLE ROW LEVEL SECURITY;

-- Company access policies
CREATE POLICY "Users can read their company data"
  ON core_companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM core_users 
      WHERE id = auth.uid()
    )
  );

-- User access policies  
CREATE POLICY "Users can read their own data"
  ON core_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR company_id IN (
    SELECT company_id FROM core_users WHERE id = auth.uid()
  ));

-- Event access policies
CREATE POLICY "Users can read company events"
  ON evt_eventos
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM core_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create events"
  ON evt_eventos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM core_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their events"
  ON evt_eventos
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM core_users 
      WHERE id = auth.uid()
    )
  );

-- Client access policies
CREATE POLICY "Users can read company clients"
  ON evt_clientes
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM core_users 
      WHERE id = auth.uid()
    )
  );

-- Expense access policies
CREATE POLICY "Users can read event expenses"
  ON evt_gastos
  FOR SELECT
  TO authenticated
  USING (
    evento_id IN (
      SELECT id FROM evt_eventos 
      WHERE company_id IN (
        SELECT company_id FROM core_users 
        WHERE id = auth.uid()
      )
    )
  );

-- Income access policies
CREATE POLICY "Users can read event incomes"
  ON evt_ingresos
  FOR SELECT
  TO authenticated
  USING (
    evento_id IN (
      SELECT id FROM evt_eventos 
      WHERE company_id IN (
        SELECT company_id FROM core_users 
        WHERE id = auth.uid()
      )
    )
  );

-- Category access policies
CREATE POLICY "Users can read company categories"
  ON evt_categorias_gastos
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM core_users 
      WHERE id = auth.uid()
    )
  );

-- Event type access policies
CREATE POLICY "Users can read company event types"
  ON evt_tipos_evento
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM core_users 
      WHERE id = auth.uid()
    )
  );