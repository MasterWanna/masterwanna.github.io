# Personal website

## Structure

```text
HomePage/
├── index.html
├── pages/
│   └── PhysForge.html
├── assets/
│   └── PhysForge/
│       ├── css/
│       ├── js/
│       ├── figures/
│       ├── media/
│       └── posters/
└── .nojekyll
```

`index.html` is the blank home page. The project page is `pages/PhysForge.html`;
its resource URLs begin with `../assets/PhysForge/`.

## Local preview

Run `python3 -m http.server 8000` from this directory and open
http://localhost:8000/pages/PhysForge.html.

## GitHub Pages

The publishing source remains `main` / `/(root)`.
After publication, the project URL is https://masterwanna.github.io/pages/PhysForge.html.
There is no root `PhysForge.html`, redirect, or compatibility route.

These changes are local only and have not been published.
