-- Migration 006: Create audit_logs table for tracking enrollment changes
-- Story: 4.4 - Ferramenta Administrativa de Movimentação de Alunos
-- Date: 2025-11-04

-- Create audit_logs table for tracking enrollment changes
CREATE TABLE IF NOT EXISTS pse.audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id INT NOT NULL,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
  changed_by INT NOT NULL REFERENCES shared.profissionais(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),  -- Support IPv6
  user_agent TEXT
);

-- Create indexes for efficient audit log queries
CREATE INDEX idx_audit_logs_record ON pse.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_by ON pse.audit_logs(changed_by);
CREATE INDEX idx_audit_logs_changed_at ON pse.audit_logs(changed_at DESC);

-- Create GIN index for JSONB search (optional, for advanced filtering)
CREATE INDEX idx_audit_logs_old_values ON pse.audit_logs USING GIN (old_values);
CREATE INDEX idx_audit_logs_new_values ON pse.audit_logs USING GIN (new_values);

-- Add comment to table
COMMENT ON TABLE pse.audit_logs IS 'Audit trail for tracking changes to enrollment and other critical data';
COMMENT ON COLUMN pse.audit_logs.table_name IS 'Fully qualified table name (e.g., pse.matriculas)';
COMMENT ON COLUMN pse.audit_logs.record_id IS 'Primary key of the record being audited';
COMMENT ON COLUMN pse.audit_logs.action_type IS 'Type of action: CREATE, UPDATE, or DELETE';
COMMENT ON COLUMN pse.audit_logs.changed_by IS 'Profissional ID who made the change';
COMMENT ON COLUMN pse.audit_logs.old_values IS 'JSONB snapshot of values before change';
COMMENT ON COLUMN pse.audit_logs.new_values IS 'JSONB snapshot of values after change';
