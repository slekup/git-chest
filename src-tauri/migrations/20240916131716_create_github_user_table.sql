-- Create the 'github_user' table.
CREATE TABLE IF NOT EXISTS github_user (
    user_id INTEGER NOT NULL,
    login TEXT NOT NULL,
    id INTEGER PRIMARY KEY NOT NULL,
    node_id TEXT NOT NULL,
    gravatar_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type in ('User', 'Organization')), 
    site_admin BOOLEAN NOT NULL CHECK (site_admin IN (0, 1)),
    name TEXT,
    company TEXT,
    blog TEXT NOT NULL,
    location TEXT,
    hireable TEXT,
    bio TEXT,
    twitter_username TEXT,
    public_repos INTEGER NOT NULL,
    public_gists INTEGER NOT NULL,
    followers INTEGER NOT NULL,
    following INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id)
        REFERENCES user (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);
