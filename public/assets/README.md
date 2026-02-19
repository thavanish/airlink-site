# public/assets — File Guide

## Root level
Place these directly in public/assets/:

  plane.png              — Logo shown in navbar and footer
  screenshot-1.jpg       — Hero background slideshow (add up to 6)
  screenshot-2.jpg
  screenshot-3.jpg
  screenshot-4.jpg
  screenshot-5.jpg
  screenshot-6.jpg

## Feature images — public/assets/features/<feature-name>/
Each feature card has its own folder. Add up to 5 images numbered 1.jpg, 2.jpg etc.
The popup slideshow will show whichever ones exist, with arrow navigation.
If none exist, the emoji icon is shown as a fallback.

  features/
    server-management/    1.jpg, 2.jpg, 3.jpg ...
    user-system/          1.jpg, 2.jpg ...
    addon-architecture/   1.jpg, 2.jpg ...
    database-migrations/  1.jpg, 2.jpg ...
    modern-stack/         1.jpg, 2.jpg ...
    rest-api/             1.jpg, 2.jpg ...

## Addon images — public/assets/addons/<addon-slug>/
Each addon has its own folder with:
  icon.png               — Square icon shown on card and popup (falls back to emoji)
  1.jpg, 2.jpg ...       — Screenshots shown in popup slideshow

  addons/
    modrinth-store/
      icon.png
      1.jpg
      2.jpg
      3.jpg
    parachute/
      icon.png
      1.jpg
      2.jpg

## Adding a new addon
1. Add images to public/assets/addons/your-addon-slug/
2. Add an entry to window.ADDON_DEFS in index.html
3. Add an .addon-marketplace-card div in the HTML
