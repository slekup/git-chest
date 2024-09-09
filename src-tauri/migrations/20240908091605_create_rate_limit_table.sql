-- Create the 'rate_limit' table.
CREATE TABLE IF NOT EXISTS rate_limit (
    id TEXT PRIMARY KEY,
    max INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    used INTEGER NOT NULL,
    reset_at TIMESTAMP NOT NULL,
    resource TEXT NOT NULL
);
