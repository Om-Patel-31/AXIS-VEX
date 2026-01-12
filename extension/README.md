# VEX Competition Starter

Create a ready-to-build VEX V5 competition project from the AXIS starter template with a single command.

## What this extension does
- Adds the command **VEX: Create Competition Project** that scaffolds a new project from the bundled template.
- Copies source, headers, VS Code settings, Makefile, and VEX build scripts (excludes compiled `build` artifacts).
- Stamps the new project name and creation date into `.vscode/vex_project_settings.json`.

## Getting started (development)
1. Install dependencies: `npm install` (run from the `extension` folder).
2. Build once: `npm run compile`, or keep `npm run watch` running.
3. Press **F5** to launch an Extension Development Host.
4. In the new window, open the Command Palette and run **VEX: Create Competition Project**.
5. Choose a destination folder and project name. The extension creates the project and offers to open it.

## Template contents
- `src/`, `include/`, `makefile`, `vex/`, `.vscode/`, `index.html`, and field images used by the web UI.
- Excludes generated build outputs (`build/`, `.bin`, `.elf`, `.map`, `.o`).

## Packaging
- Build and package a VSIX: `npm run package` (requires `vsce`, already in devDependencies).
