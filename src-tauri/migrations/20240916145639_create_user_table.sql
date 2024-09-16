-- Create the 'user' table.
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    user TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

-- Create an index on the 'user' column
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_user on user (user);



-- Create the 'user_avatar' table.
CREATE TABLE IF NOT EXISTS user_avatar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    ext TEXT, 
    url TEXT NOT NULL,
    FOREIGN KEY (user_id)
        REFERENCES user (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);
