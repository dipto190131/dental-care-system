-- Create credit_plans table for storing credit package pricing
CREATE TABLE IF NOT EXISTS credit_plans (
    id VARCHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    badge TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default credit plans
INSERT INTO credit_plans (id, name, credits, price, description, badge, is_active, display_order, created_at, updated_at)
VALUES
    ('plan-001', 'Starter', 5, 5, 'Perfect for a single consultation', NULL, true, 1, NOW(), NOW()),
    ('plan-002', 'Standard', 10, 10, 'Best for regular dental care', 'Most Popular', true, 2, NOW(), NOW()),
    ('plan-003', 'Premium', 20, 20, 'For families or frequent visits', NULL, true, 3, NOW(), NOW()),
    ('plan-004', 'Ultimate', 50, 50, 'Maximum value for power users', 'Best Value', true, 4, NOW(), NOW())
ON CONFLICT DO NOTHING;
