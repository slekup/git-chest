-- Create the 'rate_limit' table.
CREATE TABLE IF NOT EXISTS rate_limit (
    id TEXT PRIMARY KEY,
    limit_value INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    reset_value TIMESTAMP NOT NULL
);
