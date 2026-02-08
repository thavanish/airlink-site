# AirLink Website Setup Guide

## What You Got

A complete static website for the AirLink Panel project with:
- Natural directory structure with proper file organization
- Grey/white color scheme as requested
- GitHub Actions workflow for automated deployment
- Complete documentation pages
- Responsive design

## Quick Start

1. **Extract the zip file**
   ```bash
   unzip airlink-website.zip
   cd airlink-website
   ```

2. **Add your logo**
   - Place your `plane.png` file in the root directory
   - The logo should be around 64x64 pixels
   - Transparent background works best

3. **Test locally**
   ```bash
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

4. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## GitHub Pages Setup

1. Go to your repository settings
2. Navigate to Pages section
3. Select "Deploy from a branch"
4. Choose `gh-pages` branch
5. The GitHub Action will automatically deploy on push to main

## Customization

### Change Domain
Edit `CNAME` file with your actual domain:
```
airlink.yourdomain.com
```

### Update Links
Search and replace `airlink.example.com` with your actual domain in:
- `sitemap.xml`
- `robots.txt`

### Modify Content
- Main page: `index.html`
- Documentation: `docs/*.html`
- Styles: `src/css/main.css`
- Colors: Edit CSS variables in `src/css/main.css` (`:root` section)

## File Structure

```
airlink-website/
├── index.html              # Main landing page
├── 404.html               # Error page
├── plane.png              # Logo (add yours here)
├── docs/                  # Documentation
│   ├── quickstart.html
│   ├── addon-docs.html
│   └── migrations.html
├── src/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript
│   └── images/           # Image assets
├── .github/
│   └── workflows/        # GitHub Actions
└── public/               # Additional static files

```

## Color Scheme

The site uses a grey-focused palette:
- Main background: #111111 (grey-900)
- Secondary background: #1a1a1a (grey-800)
- Card backgrounds: #2a2a2a (grey-700)
- Text: #cccccc (grey-200) and #ffffff (white)
- Accent: #4a9eff (blue)

Change these in `src/css/main.css` under `:root` variables.

## Features

- Smooth scrolling navigation
- Responsive mobile design
- Code syntax highlighting
- GitHub Actions deployment
- SEO optimized (sitemap, robots.txt)
- Clean, professional design
- No frameworks needed (vanilla HTML/CSS/JS)

## Support

For issues or questions about the AirLink Panel itself:
- GitHub: https://github.com/AirlinkLabs/panel
- Discord: https://discord.gg/D8YbT9rDqz

For website issues, check the GitHub repository issues page.
