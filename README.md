# DevDocs++

DevDocs++ is a modern, developer-friendly documentation application built with Next.js, React, TypeScript, and Tailwind CSS. It's inspired by MkDocs and aims to provide a clean, readable, and highly customizable static site generator for your documentation needs.

## Features

- **Markdown-Based Content**: Write documentation using standard Markdown syntax.
- **Customizable Themes**: Easily switch between light, dark, and system themes. More themes can be added.
- **Fast Client-Side Search**: Powered by Lunr.js to quickly find relevant documentation.
- **Syntax Highlighting**: Code blocks are beautifully highlighted using PrismJS.
- **Responsive Design**: Optimized for viewing on desktops, tablets, and mobile devices.
- **Developer-Focused UI**: Clean layout with a fixed sidebar for navigation and a spacious content area.
- **Configurable Navigation**: Define your site structure and navigation menu via a simple `config.yml` file.
- **Built with Modern Tech**: Leverages Next.js for performance (SSG), TypeScript for type safety, and Tailwind CSS for flexible styling.

## Project Structure

```
.
├── content/
│   └── docs/                # Your Markdown documentation files
│       ├── index.md
│       ├── about.md
│       └── guides/
│           └── getting-started.md
├── public/
│   └── config.yml           # Site configuration (name, navigation, theme)
│   └── assets/              # Static assets like images
├── src/
│   ├── app/                 # Next.js App Router (pages, layout)
│   ├── components/          # React components (layout, UI, navigation, content, search)
│   ├── lib/                 # Utility functions (config parsing, markdown processing, fonts)
│   ├── styles/              # Global styles and Tailwind CSS
│   └── types/               # TypeScript type definitions
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1.  **Clone the repository (or set up your own Next.js project based on this structure):**
    ```bash
    git clone <repository-url> devdocs-plusplus
    cd devdocs-plusplus
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Configuration

Modify `public/config.yml` to customize your site:

- **`site_name`**: The name of your documentation site.
- **`nav`**: Defines the structure of your navigation sidebar. You can nest items. Paths are relative to the `content/docs/` directory (without the `.md` extension). `index` refers to `index.md`.
- **`theme`**:
    - `default`: `light`, `dark`, or `system`.
    - `options`: List of available themes (currently `light` and `dark`).
- **`search`**:
    - `enabled`: `true` or `false` to enable/disable search.

Example `public/config.yml`:
```yaml
site_name: My Awesome Project
nav:
  - title: Home
    path: index
  - title: User Guide
    children:
      - title: Installation
        path: guides/installation
      - title: Configuration
        path: guides/configuration
  - title: API Reference
    path: api/overview
theme:
  default: system
  options:
    - light
    - dark
search:
  enabled: true
```

### Adding Content

Place your Markdown (`.md`) files inside the `content/docs/` directory. You can organize them into subdirectories.
Frontmatter (like `title`) can be added to the top of your Markdown files:

```markdown
---
title: My First Document
---

# Welcome

This is the content of my first document.
```

### Running in Development Mode

```bash
npm run dev
# or
yarn dev
```

This will start the Next.js development server, typically at `http://localhost:3000`.

### Building for Production

```bash
npm run build
# or
yarn build
```

This command builds the application for production. The output will be in the `.next` directory.

### Starting the Production Server

After building, you can start the production server:

```bash
npm start
# or
yarn start
```

## Customization

- **Styling**: Modify Tailwind CSS classes in components or update `src/app/globals.css` for global styles and theme variables.
- **Fonts**: Change fonts in `src/lib/fonts.ts` and `tailwind.config.ts`.
- **Components**: Extend or modify React components in `src/components/`.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open-source (specify license if applicable, e.g., MIT License).
```