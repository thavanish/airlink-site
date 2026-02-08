# AirLink Panel Website

This is the official website for AirLink Panel, an open-source game server management platform.

## Overview

The website provides information about AirLink Panel, installation instructions, addon development guides, and community resources.

## Structure

```
airlink-website/
├── index.html              # Main landing page
├── docs/                   # Documentation pages
│   ├── quickstart.html     # Quick start guide
│   ├── addon-docs.html     # Complete addon documentation
│   └── migrations.html     # Database migrations guide
├── src/
│   ├── css/               # Stylesheets
│   │   ├── main.css
│   │   └── responsive.css
│   ├── js/                # JavaScript files
│   │   └── main.js
│   └── images/            # Image assets
├── .github/
│   └── workflows/         # GitHub Actions
│       └── deploy.yml
└── plane.png              # Logo
```

## Local Development

To run the website locally:

1. Clone the repository
2. Open `index.html` in your browser
3. Or use a local server:
   ```bash
   python -m http.server 8000
   ```
4. Visit `http://localhost:8000`

## Deployment

The website is automatically deployed to GitHub Pages when changes are pushed to the main branch.

## Contributing

If you find issues or want to improve the website:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see the main AirLink Panel repository for details.
