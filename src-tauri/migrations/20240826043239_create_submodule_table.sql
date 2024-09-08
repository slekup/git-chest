--Create the 'submodule' table.
CREATE TABLE IF NOT EXISTS submodule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    submodule_repo_id INTEGER NOT NULL,
    FOREIGN KEY (repo_id)
        REFERENCES repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    FOREIGN KEY (submodule_repo_id)
        REFERENCES repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'repo_id'  and 'submodule_repo_id' columns
CREATE INDEX IF NOT EXISTS idx_submodule_repo_id on submodule (repo_id);
CREATE INDEX IF NOT EXISTS idx_submodule_repo_id on submodule (submodule_repo_id);
