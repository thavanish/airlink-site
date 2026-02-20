/*
  config.js — loads config.json and exposes window.SITE_CONFIG.
  Must be the very first script loaded on every page (after icons.js).
  All other JS files read from window.SITE_CONFIG instead of hard-coding values.
*/

(function () {

  /* Synchronous XHR so the config is available before any other script runs */
  function loadConfigSync(path) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, false); /* false = synchronous */
      xhr.send(null);
      if (xhr.status === 200) {
        return JSON.parse(xhr.responseText);
      }
    } catch (e) {
      console.error('[AirLink] Failed to load config.json:', e);
    }
    return null;
  }

  /* Resolve the correct path to config.json from any depth of page */
  function findConfigPath() {
    /* Try to determine depth by checking the document URL */
    var path = window.location.pathname;
    var depth = (path.match(/\//g) || []).length;

    /* pages at depth 0-1 are root or one level deep */
    if (path.indexOf('/docs/') !== -1) {
      return '../../config.json'; /* docs/slug/index.html */
    }
    return 'config.json'; /* index.html */
  }

  var config = loadConfigSync(findConfigPath());

  if (!config) {
    /* Fallback minimal config so the page doesn't break */
    config = {
      site: { title: 'AirLink', version: '1.0.0', versionLabel: 'v1.0.0 beta',
              githubOrg: 'AirlinkLabs', githubPanel: 'AirlinkLabs/panel',
              githubDaemon: 'AirlinkLabs/daemon', discordUrl: 'https://discord.gg/D8YbT9rDqz' },
      underConstruction: { enabled: false },
      addons: [],
      features: [],
      docs: { manifest: [] }
    };
  }

  window.SITE_CONFIG = config;

  /* ── Apply under-construction immediately so there's no flash ── */
  if (config.underConstruction && config.underConstruction.enabled) {
    document.documentElement.setAttribute('data-under-construction', 'true');
  }

})();
