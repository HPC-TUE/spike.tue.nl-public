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
Deployment is intentionally manual while the site is pre-production: open
**Actions → Deploy to GitHub Pages → Run workflow** when you explicitly want
to publish the current `main` branch. Pushes to `main` do not deploy.

This repository is self-contained: release scripts live in `scripts/`, and the
design tokens are committed at `src/styles/tokens.css`. It does not depend on a
parent workspace or sibling documentation repository.

The custom domain is set in `public/CNAME`:

```text
docs.spike.tue.nl
```

If the site is deployed to a GitHub Pages project URL instead of a custom domain, update `site` and add `base` in `astro.config.mjs`.

## Content Boundary

Only public user documentation belongs here. Admin-only procedures, privileged operational notes, internal topology, and sensitive security details belong in the separate admin wiki.

## Adding Pages and Sections

Content lives in `src/content/docs/`. A page is an `.mdx` file, and its file
path becomes its URL:

```text
src/content/docs/storage/data.mdx       -> /storage/data/
src/content/docs/storage/transfers.mdx  -> /storage/transfers/
```

Start a new page by copying a nearby page and updating its frontmatter. The
frontmatter is the metadata between the two `---` lines; the validation gate
requires these fields:

```yaml
---
title: Explain the task
description: Short summary used by search and page metadata.
audience: Researchers
maturity: Experimental
lastVerified: 2026-07-21
products: [Run:ai]
requiresVpn: false
sourceRefs: [source-id]
sensitivity: public
---
```

Use `Verified` only after the instructions have been tested against the
current environment. Use `Experimental` while a migration or workflow still
needs validation, and `Historical` for context that is not a recommended
Spike workflow. Do not publish credentials, personal contact details,
internal identifiers, or unredacted screenshots.

### Creating a New Section

Create a folder with an `index.mdx` landing page and add child pages beneath
it:

```text
src/content/docs/data-operations/
├── index.mdx       -> /data-operations/
├── transfers.mdx   -> /data-operations/transfers/
└── cleanup.mdx     -> /data-operations/cleanup/
```

Add the pages to the `sidebar` array in `astro.config.mjs`; a page will build
but will not appear in navigation until it is listed there:

```js
{
  label: 'Data operations',
  items: [
    { slug: 'data-operations' },
    { slug: 'data-operations/transfers' },
    { slug: 'data-operations/cleanup' },
  ],
},
```

Use links such as `/data-operations/transfers/` in related pages. If a page is
renamed, add a redirect in `astro.config.mjs` so existing links continue to
work.

### Assets and Components

Put sanitized screenshots under `src/assets/screenshots/` and use the existing
`ScreenshotFigure` component so every image has useful alt text and a caption.
Put downloadable files under `public/downloads/` and link them with a root
path such as `/downloads/example/Containerfile`. Reuse `DocMeta`, `NextSteps`,
`TaskLink`, and the other existing components instead of introducing a new
layout for one page.

The public SSH file-transfer example is at
`public/downloads/ssh-container/Containerfile` with its matching
`sshd_config`, `start-sshd.sh`, and `README.md`. It is published at
`/downloads/ssh-container/` and documented in the [File transfer](/storage/file-transfer/)
guide.

### Check Your Changes

From this repository, run:

```bash
npm run dev          # preview locally while editing
npm run verify       # build and run authored-content checks
npm run verify:release  # include external-link checks before publishing
```

The admin wiki follows the same authoring model in its own repository; do not
reference files from this public repository.
