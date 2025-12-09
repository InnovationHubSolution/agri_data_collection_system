-- Migration: Add status tracking to surveys table
-- Description: Adds workflow status fields to track survey approval process
-- Created: 2025-12-09

-- Add status column with default value
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'interviewer_assigned';

-- Add constraint for valid status values
ALTER TABLE surveys
DROP CONSTRAINT IF EXISTS surveys_status_check;

ALTER TABLE surveys
ADD CONSTRAINT surveys_status_check CHECK (status IN (
    'supervisor_assigned',
    'interviewer_assigned',
    'completed',
    'rejected_supervisor',
    'approved_supervisor',
    'rejected_hq',
    'approved_hq'
));

-- Add rejection/approval tracking fields
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add form template reference
ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS form_template_id INTEGER REFERENCES form_templates(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_form_template ON surveys(form_template_id);

-- Update existing surveys to have default status
UPDATE surveys 
SET status = 'completed' 
WHERE status IS NULL;

-- Add comment
COMMENT ON COLUMN surveys.status IS 'Current workflow status of the survey';
COMMENT ON COLUMN surveys.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON COLUMN surveys.approved_by IS 'User ID who approved the survey';
COMMENT ON COLUMN surveys.form_template_id IS 'Reference to form template used for this survey';
