# Addon Development

This is the complete guide to developing addons for AirLink Panel. Addons let you extend the panel's functionality without modifying core code.

## Introduction

Addons are loaded dynamically when the panel starts. They can add new features, modify existing ones, and integrate with external services. Each addon runs in its own context with access to the router, database, and various utilities.

## Addon Structure

A typical addon has this directory layout:

```
my-addon/
├── package.json       # Metadata and configuration
├── index.ts           # Main entry point
├── views/             # EJS templates
│   └── main.ejs
├── public/            # Static assets (optional)
│   ├── css/
│   ├── js/
│   └── img/
└── lib/               # Additional modules (optional)
    └── helpers.ts
```

## package.json Configuration

The `package.json` file defines your addon's metadata:

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

### Required Fields

- `name` — Display name of your addon
- `version` — Version in semver format

### Optional Fields

- `description` — Brief description
- `author` — Your name or organization
- `main` — Entry point file (default: index.ts)
- `router` — Base URL path (default: /)
- `enabled` — Enable by default (default: true)
- `migrations` — Database migrations array

## Addon Entry Point

Your entry point exports a function that receives a router and API object:

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
        header: api.getComponentPath('views/components/header'),
        template: api.getComponentPath('views/components/template'),
        footer: api.getComponentPath('views/components/footer')
      }
    });
  });
}
```

## The Addon API

### Core Utilities

- `registerRoute(path, router)` — Register additional routes
- `logger` — Logging methods: info, warn, error, debug
- `prisma` — Prisma ORM client for database access

### Path Utilities

- `addonPath` — Path to the addon directory
- `viewsPath` — Path to the addon's views directory
- `getComponentPath(path)` — Get path to a panel component

### User and Server Utilities

- `utils.isUserAdmin(userId)` — Check if user is admin
- `utils.checkServerAccess(userId, serverId)` — Verify server access
- `utils.getServerById(serverId)` — Get server by ID
- `utils.getServerByUUID(uuid)` — Get server by UUID
- `utils.getServerPorts(server)` — Get server ports
- `utils.getPrimaryPort(server)` — Get primary port

### UI Components

- `ui.addSidebarItem(item)` — Add sidebar navigation item
- `ui.addServerMenuItem(item)` — Add server menu item
- `ui.addServerSection(section)` — Add server section
- `ui.addServerSectionItem(sectionId, item)` — Add item to section

## Creating Views

Views use EJS templates. Create a `views` directory in your addon folder:

```html
<%- include(components.header, { title: 'My Addon', user: user }) %>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-4">My Addon</h1>
  <p class="text-gray-400">Content here</p>
</div>

<%- include(components.footer) %>
```

## Sidebar Items

```typescript
api.ui.addSidebarItem({
  id: 'my-addon-main',
  name: 'My Addon',
  icon: '<svg ...></svg>',
  link: '/my-addon',
  section: 'main',
  order: 50
});
```

## Server Menu Items

```typescript
api.ui.addServerMenuItem({
  id: 'my-addon-server',
  name: 'My Feature',
  icon: '<svg ...></svg>',
  link: '/servers/{uuid}/my-feature',
  feature: 'custom',
  order: 50
});
```

## Best Practices

- Namespace your database tables with your addon name
- Handle errors gracefully with try-catch blocks
- Clean up resources when the addon is disabled
- Follow the panel's design patterns and UI styles
- Test in different environments and configurations
- Keep functionality focused and simple
