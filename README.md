# Personal website

Hosted at https://masterwanna.github.io/ using GitHub Pages.
The root home page is intentionally blank.

## Structure

- `index.html`: blank home page.
- `PhysForge.html`: PhysForge project page.
- `PhysForge/assets/`: self-contained styles, scripts, paper, figures, videos, and posters.
- `.nojekyll`: publish the static files directly.

The paper page is available at https://masterwanna.github.io/PhysForge.html.

## Local preview

From this directory, run `python3 -m http.server 8000`, then open
http://localhost:8000/PhysForge.html.

## Editing and publishing

Edit project content in `PhysForge.html`, presentation in
`PhysForge/assets/css/style.css`, and author / release links in
`PhysForge/assets/js/site-config.js`. Video and material mappings are in
`PhysForge/assets/js/gallery-data.js`.
All asset URLs are relative to the root HTML file and begin with `PhysForge/assets/`.

GitHub Pages publishes the `main` branch from `/(root)`.
Use the configured `git up "Describe your changes"` command to publish updates.
Keep large source data and local QA output outside the published files.
