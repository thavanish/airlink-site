# Addon Development

Complete guide to developing addons for AirLink Panel. Addons extend the panel's functionality without modifying core code.

## Introduction

Addons are loaded dynamically when the panel starts. They can add new features, modify existing ones, and integrate with external services. Each addon runs with access to the router, database, and various utilities.

## Addon Structure

```
my-addon/
├── package.json       # Metadata and configuration
├── index.ts           # Main entry point
├── views/             # EJS templates
│   └── main.ejs
├── public/            # Static assets (optional)
│   ├── css/
│   └── js/
└── lib/               # Additional modules (optional)
    └── helpers.ts
```

## package.json Configuration

```json
{
  "name": "My Addon",
  "version": "1.0.0",
  "description": "What this addon does",
  "author": "Your Name",
  "main": "index.ts",
  "router": "/my-addon",
  "enabled": true,
  "migrations": [
    {
      "name": "create_my_table",
      "sql": "CREATE TABLE IF NOT EXISTS MyTable ..."
    }
  ]
}
```

### Fields

- `name` — Display name shown in the admin panel
- `version` — Version in semver format
- `main` — Entry point file (default: index.ts)
- `router` — Base URL path for all addon routes
- `migrations` — Database migrations array (see Migrations docs)

## Entry Point

Your entry point exports a default function receiving a router and API object:

```typescript
import { Router } from 'express';
import path from 'path';

export default function(router: Router, api: any) {
  const { logger, prisma } = api;

  logger.info('Addon initialized');

  router.get('/', async (req, res) => {
    res.render(path.join(api.viewsPath, 'view.ejs'), {
      user: req.session?.user,
      req,
      settings: await prisma.settings.findUnique({ where: { id: 1 } }),
      components: {
        header:   api.getComponentPath('views/components/header'),
        template: api.getComponentPath('views/components/template'),
        footer:   api.getComponentPath('views/components/footer')
      }
    });
  });
}
```

## Addon API

### Core

- `logger` — info, warn, error, debug
- `prisma` — Prisma ORM client
- `addonPath` — Path to the addon directory
- `viewsPath` — Path to the addon's views folder
- `getComponentPath(path)` — Path to a panel component

### User Utilities

- `utils.isUserAdmin(userId)` — Check admin status
- `utils.checkServerAccess(userId, serverId)` — Verify access
- `utils.getServerById(serverId)` — Get server object
- `utils.getServerByUUID(uuid)` — Get server by UUID
- `utils.getPrimaryPort(server)` — Get primary port

### UI Registration

- `ui.addSidebarItem(item)` — Add sidebar nav item
- `ui.addServerMenuItem(item)` — Add server menu item
- `ui.addServerSection(section)` — Add server section

## Sidebar Items

```typescript
api.ui.addSidebarItem({
  id:      'my-addon-main',
  name:    'My Addon',
  icon:    '<svg ...></svg>',
  link:    '/my-addon',
  section: 'main',
  order:   50
});
```

## Server Menu Items

```typescript
api.ui.addServerMenuItem({
  id:      'my-addon-server',
  name:    'My Feature',
  icon:    '<svg ...></svg>',
  link:    '/servers/{uuid}/my-feature',
  feature: 'custom',
  order:   50
});
```

## Views

Views use EJS and include the panel's shared header/footer/template components:

```html
<%- include(components.header, { title: 'My Addon', user: user }) %>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-4">My Addon</h1>
  <p class="text-gray-400">Content here</p>
</div>

<%- include(components.footer) %>
```

## Best Practices

- Prefix all database tables with your addon slug
- Always wrap async route handlers in try-catch
- Use the provided logger rather than console.log
- Keep functionality focused — one addon, one concern
- Test with both fresh installs and existing databases
