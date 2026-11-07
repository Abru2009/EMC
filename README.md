# EMC Math Calculators

EMC is a lightweight, browser-based collection of mathematics calculators organized around the CBSE/NCERT syllabi for Grades 10, 11, and 12. The project is designed to help students explore concepts, check their work, and see calculation steps and visual explanations where available.

## Features

- Chapter-organized calculators for Grades 10–12, with searchable chapter lists.
- Grade 11 and Grade 12 tools for topics such as sets, functions, matrices, determinants, calculus, vectors, probability, and linear programming.
- Formula explanations, worked steps, and diagrams or graphs on supported calculators.
- Appearance settings for light and dark mode and selectable color palettes.
- A responsive interface intended to work on desktop and mobile devices.
- Links to the corresponding NCERT mathematics textbooks. Grade 12 displays Part I and Part II cover images.

## Open the site

The site is hosted with GitHub Pages at <https://abru2009.github.io/EMC/main.html>. Open `main.html` for the home page or `calculators.html` to browse the searchable calculator library.

## Run locally

The project is static HTML, CSS, JavaScript, and image assets; it does not require a package installation or build step. Open `main.html` in a browser, or serve the project directory with a local HTTP server. For example, if Python is installed:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000/main.html>.

## Project structure

- `main.html`, `styles.css`, `theme.css`, and `theme.js` provide the home page, shared styling, and appearance/grade settings.
- `calculators.html` is the searchable library of calculator links.
- `grade-10/`, `grade-11/`, and `grade-12/` contain grade-specific calculator pages and chapter indexes.
- `grade-calculators.js` contains shared calculator logic; `grade-calculators.css` styles those calculator pages and their visualizations.
- `data/` contains the logo and textbook cover images.
- `credits.html` lists project credits.

## Tools used

- Claude
- ChatGPT
- GitHub Copilot
