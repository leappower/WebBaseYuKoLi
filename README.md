# Health Food OEM/ODM Website Scaffold

> A config-driven, multilingual, responsive website scaffold for health food OEM/ODM companies. Swap `site.config.js` and you have a brand-new site.

## Overview

This scaffold generates a complete B2B corporate website from a single configuration file — no frontend framework, no build-time rendering dependency. HTML + IIFE JS (ES5) + CSS Variables + Tailwind CDN.

**Ideal for:** OEM/ODM health food companies, food & beverage equipment manufacturers, or any B2B product showcase site.

## Quick Start

```bash
git clone https://github.com/org/brand-project.git
cd brand-project
npm install
./build.sh dev
```

Open your browser to `http://localhost:3000`. Edit `site.config.js`, refresh — changes take effect immediately.

## Features

- **Config-driven** — One `site.config.js` file controls the entire site (brand info, navigation, products, SEO, social links, etc.)
- **Pure static multi-page** — HTML + IIFE JS + CSS Variables + Tailwind CDN, zero frontend build dependency
- **25 languages** — Built-in translation system, async loading on demand, graceful degradation
- **Triple-screen responsive** — PC / Tablet / Mobile layouts
- **RTL support** — Arabic, Hebrew auto-switch layout direction
- **Build toolchain** — `build.sh` (main build), webpack (auxiliary bundling), `build-ssg.js` (static generation)
- **Node.js ≥ 16, npm ≥ 8**

## site.config.js

The heart of the scaffold. Key sections:

| Section | Purpose |
|---------|---------|
| `brand` | Company name, logo, tagline, colors |
| `nav` | Navigation menu items and structure |
| `products` | Product categories and items |
| `seo` | Meta titles, descriptions, OG tags per page |
| `social` | Social media links |
| `contact` | Phone, email, WhatsApp, address |
| `i18n` | Supported languages and default locale |

Example:

```javascript
module.exports = {
  brand: {
    name: 'Your Brand',
    tagline: 'Your tagline here',
    primaryColor: '#2E7D32',
  },
  contact: {
    phone: '+1234567890',
    email: 'info@example.com',
  },
  // ... see site.config.js for full options
};
```

## Project Structure

```
brand-project/
├── site.config.js          # 🎯 Site configuration (edit this)
├── build.sh                # Main build script
├── build-ssg.js            # Static site generator
├── webpack.config.js       # Auxiliary bundling
├── index.html              # Entry page
├── assets/                 # Static assets
│   ├── js/                 # Business scripts (IIFE)
│   ├── css/                # Stylesheets
│   └── images/             # Image assets
├── data/                   # Product & content data
└── docs/                   # Documentation
```

## Deployment

```bash
# Production build
./build.sh prod

# Output goes to dist/
# Deploy dist/ to any static host (Netlify, Vercel, S3, Nginx, etc.)
```

## Documentation

| Doc | Description |
|-----|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [BUILD.md](docs/BUILD.md) | Build & deployment |
| [DEV-STANDARDS.md](docs/DEV-STANDARDS.md) | Development standards |
| [I18N.md](docs/I18N.md) | Multilingual system |
| [SECURITY.md](docs/SECURITY.md) | Security policy |
| [SITE-CONFIG.md](docs/SITE-CONFIG.md) | Configuration reference |

## License

MIT
