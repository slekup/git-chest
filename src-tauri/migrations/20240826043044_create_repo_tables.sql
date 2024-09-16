-- Create the 'repo' table.
CREATE TABLE IF NOT EXISTS repo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    user TEXT NOT NULL,
    repo TEXT NOT NULL,
    clone_data BOOLEAN CHECK (clone_data IN (0, 1)) DEFAULT 0,
    auto_sync BOOLEAN CHECK (auto_sync IN (0, 1, 2)) DEFAULT 2,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

-- Create an index on the 'platform', 'user' and 'repo' columns
CREATE INDEX IF NOT EXISTS idx_repo_platform on repo (platform);
CREATE INDEX IF NOT EXISTS idx_repo_user on repo (user);
CREATE INDEX IF NOT EXISTS idx_repo_repo on repo (repo);



-- Create the 'watch_repo_event' table.
CREATE TABLE IF NOT EXISTS watch_repo_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    event TEXT NOT NULL,
    FOREIGN KEY (repo_id)
        REFERENCES repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'repo_id' column
CREATE INDEX IF NOT EXISTS idx_watch_repo_event_repo_id on watch_repo_event (repo_id);



-- Create the 'repo_tree' table.
CREATE TABLE IF NOT EXISTS repo_tree (
    repo_id INTEGER PRIMARY KEY NOT NULL,
    sha TEXT NOT NULL,
    truncated BOOLEAN NOT NULL CHECK (truncated IN (0, 1)),
    FOREIGN KEY (repo_id)
        REFERENCES repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);



-- Create the 'repo_tree_item' table.
CREATE TABLE IF NOT EXISTS repo_tree_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    parent_id INTEGER,
    path TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode in ('100644', '100755', '040000', '120000', '160000')),
    type TEXT NOT NULL CHECK (type in ('tree', 'blob', 'commit')),
    sha TEXT NOT NULL,
    size INTEGER,
    FOREIGN KEY (repo_id)
        REFERENCES repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
    FOREIGN KEY (parent_id)
        REFERENCES repo_tree_item (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

-- Create an index on the 'repo_id' and 'parent_id' columns
CREATE INDEX IF NOT EXISTS idx_repo_tree_item_repo_id on repo_tree_item (repo_id);
CREATE INDEX IF NOT EXISTS idx_repo_tree_item_parent_id on repo_tree_item (parent_id);



-- Create the 'repo_readme' table.
CREATE TABLE IF NOT EXISTS repo_readme (
    repo_id INTEGER PRIMARY KEY NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (repo_id)
        REFERENCES repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);



-- Create the 'repo_readme_image' table.
CREATE TABLE IF NOT EXISTS repo_readme_asset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type in ('image', 'video')), 
    ext TEXT CHECK (ext in ('png', 'jpg', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'ico')), 
    url TEXT NOT NULL,
    alt TEXT,
    FOREIGN KEY (repo_id)
        REFERENCES repo (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);
