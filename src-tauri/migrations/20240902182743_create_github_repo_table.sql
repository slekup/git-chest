-- Create the 'github_repo' table.
CREATE TABLE IF NOT EXISTS github_repo (
    repo_id INTEGER NOT NULL,
    id INTEGER PRIMARY KEY NOT NULL,
    node_id TEXT,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    private BOOLEAN NOT NULL CHECK (private IN (0, 1)),
    description TEXT NOT NULL,
    fork BOOLEAN NOT NULL CHECK (fork IN (0, 1)),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    pushed_at DATETIME NOT NULL,
    homepage TEXT,
    size INTEGER NOT NULL,
    stargazers_count INTEGER NOT NULL,
    watchers_count INTEGER NOT NULL,
    language TEXT NOT NULL,
    has_issues BOOLEAN NOT NULL CHECK (has_issues IN (0, 1)),
    has_projects BOOLEAN NOT NULL CHECK (has_projects IN (0, 1)),
    has_downloads BOOLEAN NOT NULL CHECK (has_downloads IN (0, 1)),
    has_wiki BOOLEAN NOT NULL CHECK (has_wiki IN (0, 1)),
    has_pages BOOLEAN NOT NULL CHECK (has_pages IN (0, 1)),
    has_discussions BOOLEAN NOT NULL CHECK (has_discussions IN (0, 1)),
    forks_count INTEGER NOT NULL,
    archived BOOLEAN NOT NULL CHECK (archived IN (0, 1)),
    disabled BOOLEAN NOT NULL CHECK (disabled IN (0, 1)),
    open_issues_count INTEGER NOT NULL,
    allow_forking BOOLEAN NOT NULL CHECK (allow_forking IN (0, 1)),
    is_template BOOLEAN NOT NULL CHECK (is_template IN (0, 1)),
    web_commit_signoff_required BOOLEAN NOT NULL CHECK (web_commit_signoff_required IN (0, 1)),
    visibility TEXT NOT NULL,
    forks INTEGER NOT NULL,
    open_issues INTEGER NOT NULL,
    watchers INTEGER NOT NULL,
    default_branch TEXT NOT NULL,
    network_count INTEGER NOT NULL,
    subscribers_count INTEGER NOT NULL,
    FOREIGN KEY (repo_id)
        REFERENCES repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'repo_id' column
CREATE UNIQUE INDEX IF NOT EXISTS idx_github_repo_repo_id on github_repo (repo_id);



-- Create the 'github_repo_owner' table.
CREATE TABLE IF NOT EXISTS github_repo_owner (
    github_repo_id INTEGER NOT NULL,
    login TEXT NOT NULL,
    id INTEGER PRIMARY KEY NOT NULL,
    node_id TEXT NOT NULL,
    gravatar_id TEXT NOT NULL,
    type TEXT NOT NULL,
    site_admin BOOLEAN NOT NULL CHECK (site_admin IN (0, 1)),
    FOREIGN KEY (github_repo_id)
        REFERENCES github_repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'github_repo_id' column
CREATE INDEX IF NOT EXISTS idx_github_repo_owner_github_repo_id on github_repo_owner (github_repo_id);



-- Create the 'github_repo_org' table.
CREATE TABLE IF NOT EXISTS github_repo_org (
    github_repo_id INTEGER NOT NULL,
    login TEXT NOT NULL,
    id INTEGER PRIMARY KEY NOT NULL,
    node_id TEXT NOT NULL,
    gravatar_id TEXT NOT NULL,
    type TEXT NOT NULL,
    site_admin BOOLEAN NOT NULL CHECK (site_admin IN (0, 1)),
    FOREIGN KEY (github_repo_id)
        REFERENCES github_repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'github_repo_id' column
CREATE INDEX IF NOT EXISTS idx_github_repo_org_github_repo_id on github_repo_org (github_repo_id);



-- Create the 'github_repo_topic' table.
CREATE TABLE IF NOT EXISTS github_repo_topic (
    github_repo_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    FOREIGN KEY (github_repo_id)
        REFERENCES github_repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'github_repo_id' column
CREATE INDEX IF NOT EXISTS idx_github_repo_topic_github_repo_id on github_repo_topic (github_repo_id);



-- Create the 'github_repo_license' table.
CREATE TABLE IF NOT EXISTS github_repo_license (
    github_repo_id INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    name TEXT NOT NULL,
    spdx_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    FOREIGN KEY (github_repo_id)
        REFERENCES github_repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'github_repo_id' column
CREATE INDEX IF NOT EXISTS idx_github_repo_license_github_repo_id on github_repo_license (github_repo_id);



-- Create the 'github_repo_custom_property' table.
CREATE TABLE IF NOT EXISTS github_repo_custom_property (
    github_repo_id INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    value TEXT NOT NULL,
    FOREIGN KEY (github_repo_id)
        REFERENCES github_repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'github_repo_id' column
CREATE INDEX IF NOT EXISTS idx_github_repo_custom_property_github_repo_id on github_repo_custom_property (github_repo_id);
