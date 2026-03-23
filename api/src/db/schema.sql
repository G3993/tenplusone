CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff TEXT NOT NULL,
  status TEXT DEFAULT 'SCHEDULED',
  score_home INTEGER,
  score_away INTEGER,
  match_data TEXT,
  group_id TEXT,
  venue TEXT,
  odds_home REAL,
  odds_draw REAL,
  odds_away REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wagers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_email TEXT NOT NULL,
  match_id TEXT NOT NULL REFERENCES matches(id),
  pick TEXT NOT NULL,
  product_id TEXT,
  status TEXT DEFAULT 'PENDING',
  discount_code TEXT,
  discount_pct REAL,
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_wagers_match ON wagers(match_id);
CREATE INDEX IF NOT EXISTS idx_wagers_email ON wagers(user_email);
CREATE INDEX IF NOT EXISTS idx_wagers_status ON wagers(status);

CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  image_url TEXT,
  shopify_product_id TEXT,
  printful_product_id TEXT,
  printful_sync_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_designs_match ON designs(match_id);
