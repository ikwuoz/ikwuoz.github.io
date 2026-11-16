# Emmanuel Ikwuoma

Personal website and technical blog — live at [ikwuoz.github.io](https://ikwuoz.github.io/) ([/blog](https://ikwuoz.github.io/blog)).

Built with Astro, Tailwind CSS v4, TypeScript, and Astro Content Collections (`@astrojs/mdx` + Shiki).

## Project Structure

```text
├── public/               # Static assets, favicons, and article images
├── src/
│   ├── components/       # Navigation, section grid, ledgers, and theme toggle
│   ├── content/blog/     # Technical articles (.md / .mdx)
│   ├── data/             # Portfolio overview, selected work, and experience
│   ├── layouts/          # Base document shell and theme initialization
│   ├── pages/            # Home (/) and Blog (/blog) routes
│   └── styles/           # Neo-Swiss Light/Dark tokens and prose styles
```

## Development

Requires **Node.js `>= 22.23.4`**.

```sh
npm install
npm run dev       # Start local dev server at http://localhost:4321
npm run build     # Build static site to ./dist/
npm run preview   # Preview production build locally
```

## Adding Articles

Add a `.md` or `.mdx` file under `src/content/blog/` with the required frontmatter:

```yaml
---
title: "Article Title"
description: "Short summary of the post."
pubDate: 2026-11-16
tags:
  - solidity
  - architecture
draft: false
---
```

Pushing to `main` triggers [deploy.yml](.github/workflows/deploy.yml) to build and publish to [https://ikwuoz.github.io/](https://ikwuoz.github.io/).
