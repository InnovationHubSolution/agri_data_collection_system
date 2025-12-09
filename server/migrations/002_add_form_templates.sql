-- Migration: Add form templates table for Survey Designer
-- Description: Stores custom form/questionnaire templates created in the visual designer
-- Created: 2025-12-09

CREATE TABLE IF NOT EXISTS form_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    published_by INTEGER REFERENCES users(id)
);

-- Add indexes for better query performance
CREATE INDEX idx_form_templates_published ON form_templates(published);
CREATE INDEX idx_form_templates_created_at ON form_templates(created_at);
CREATE INDEX idx_form_templates_updated_at ON form_templates(updated_at);
CREATE INDEX idx_form_templates_created_by ON form_templates(created_by);

-- Add comment
COMMENT ON TABLE form_templates IS 'Stores custom survey form templates created in the visual designer';
COMMENT ON COLUMN form_templates.questions IS 'JSONB array containing question definitions with type, label, options, validation, and skip logic';
COMMENT ON COLUMN form_templates.published IS 'Whether this form is published and available to mobile app users';
