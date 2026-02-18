# Database Migrations

AirLink Panel lets addons define database migrations in their `package.json`. These run automatically when the addon is enabled.

## How It Works

1. Migrations are defined in `package.json` as an array of objects
2. When an addon is enabled, unapplied migrations are detected
3. Each migration runs in the order defined
4. Applied migrations are recorded in the `AddonMigration` table
5. If a migration fails, the addon is disabled and an error is logged

## Defining Migrations

```json
{
  "name": "My Addon",
  "version": "1.0.0",
  "migrations": [
    {
      "name": "create_my_table",
      "sql": "CREATE TABLE IF NOT EXISTS MyAddonTable (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
    },
    {
      "name": "add_description_column",
      "sql": "ALTER TABLE MyAddonTable ADD COLUMN description TEXT"
    }
  ]
}
```

### Migration Fields

- `name` — Unique identifier used to track which migrations have been applied. Changing the name causes it to run again.
- `sql` — The SQL statement to execute

## When Migrations Run

- **First install** — all migrations run in order
- **Re-enabling a disabled addon** — any unapplied migrations run
- **Addon update with new migrations** — only new ones run on next enable

Migrations do **not** re-run while an addon is already enabled.

## Querying Migrated Tables

Since addon tables aren't in the Prisma schema, use raw queries:

```typescript
async function getEntries() {
  return await prisma.$queryRaw`
    SELECT * FROM MyAddonTable ORDER BY created_at DESC
  `;
}

async function addEntry(name: string, description: string) {
  await prisma.$executeRaw`
    INSERT INTO MyAddonTable (name, description) VALUES (${name}, ${description})
  `;
}
```

## Common Migration Types

### Creating a Table

```json
{
  "name": "create_my_table",
  "sql": "CREATE TABLE IF NOT EXISTS MyTable (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
}
```

### Adding a Column

```json
{
  "name": "add_description_column",
  "sql": "ALTER TABLE MyTable ADD COLUMN description TEXT"
}
```

### Creating an Index

```json
{
  "name": "add_name_index",
  "sql": "CREATE INDEX IF NOT EXISTS idx_my_table_name ON MyTable(name)"
}
```

### Foreign Key Relationship

```json
{
  "name": "create_user_settings_table",
  "sql": "CREATE TABLE IF NOT EXISTS MyAddon_UserSettings (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, setting TEXT NOT NULL, value TEXT, FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE)"
}
```

## Best Practices

- Always use `IF NOT EXISTS` for table creation
- Prefix table names with your addon slug — `MyAddon_Users` not `Users`
- Keep each migration to a single change
- Use descriptive names like `create_users_table` or `add_email_to_users`
- Order matters — migrations run in array order, so put dependencies first

## Debugging

Check which migrations have been applied:

```typescript
const applied = await prisma.$queryRaw`
  SELECT * FROM AddonMigration WHERE addonSlug = 'your-addon-slug'
`;
```

Reset in development only:

```typescript
await prisma.$executeRaw`
  DELETE FROM AddonMigration WHERE addonSlug = 'your-addon-slug'
`;
```

> **Warning:** Only reset migrations in development. Doing this in production will cause the migrations to re-run which may destroy existing data.

## Troubleshooting

- **Syntax errors** — validate your SQL before adding it
- **Table already exists** — use `IF NOT EXISTS`
- **Missing references** — ensure referenced tables exist and are created earlier in the array
