# Spike-1 Public Wiki

Astro/Starlight static documentation site for public Spike-1 user documentation.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Before publishing, run the complete static release gate:

```bash
npm run verify:release
```

This checks authored terminology, required metadata, internal and external
links, screenshot governance, accessibility, design tokens, and the Podman
script test suite.

## Deployment

This folder is configured for GitHub Pages through `.github/workflows/deploy.yml`.

This repository is self-contained: release scripts live in `scripts/`, and the
design tokens are committed at `src/styles/tokens.css`. It does not depend on a
parent workspace or sibling documentation repository.

The custom domain is set in `public/CNAME`:

```text
spike.tue.nl
```

If the site is deployed to a GitHub Pages project URL instead of a custom domain, update `site` and add `base` in `astro.config.mjs`.

## Content Boundary

Only public user documentation belongs here. Admin-only procedures, privileged operational notes, internal topology, and sensitive security details belong in the separate admin wiki.
