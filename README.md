<div align="center">

# EMC · Math Made Easier

### CBSE / NCERT mathematics calculators for Grades 10, 11 & 12

Explore a concept, check your working, and see how the answer comes together.

[![Open the website](https://img.shields.io/badge/Explore%20the%20calculators-Visit%20EMC-b85b3c?style=for-the-badge)](https://abru2009.github.io/EMC/main.html)
[![Grades](https://img.shields.io/badge/Grades-10%20%7C%2011%20%7C%2012-334e68?style=for-the-badge)](https://abru2009.github.io/EMC/calculators.html)
[![Curriculum](https://img.shields.io/badge/Curriculum-CBSE%20%2F%20NCERT-49796b?style=for-the-badge)](https://ncert.nic.in/)

</div>

## Find your grade

| Grade | Explore topics | Calculator hub |
|:--|:--|:--|
| **10** | Real numbers, polynomials, linear and quadratic equations, arithmetic progressions, triangles, coordinate geometry, trigonometry, circles, mensuration, statistics, and probability | [Open Grade 10 calculators](https://abru2009.github.io/EMC/calculators.html#grade-10) |
| **11** | Sets, relations and functions, trigonometry, induction, complex numbers, inequalities, permutations and combinations, binomial theorem, sequences, coordinate geometry, limits, statistics, and probability | [Open Grade 11 calculators](https://abru2009.github.io/EMC/grade-11/index.html) |
| **12** | Relations and functions, inverse trigonometry, matrices, determinants, calculus, vectors, 3D geometry, linear programming, and probability | [Open Grade 12 calculators](https://abru2009.github.io/EMC/grade-12/index.html) |

Browse all grades from the [searchable calculator library](https://abru2009.github.io/EMC/calculators.html).

## Learn while you calculate

- **Chapter-focused tools** to explore common CBSE / NCERT mathematics topics.
- **Clear steps and formulas** that help explain how a result is obtained.
- **Visual explanations** including graphs and diagrams on supported calculators.
- **Flexible inputs** for trying your own values and comparing examples.
- **Light and dark modes**, selectable color themes, and grade-aware settings.
- **Responsive pages** designed to work on phones, tablets, and computers.
- **Textbook links** to NCERT resources; Grade 12 includes both Part I and Part II covers.

> These calculators are study aids. Use them to check and explore your work, not as a replacement for learning the method.

## Open EMC

Visit the [EMC calculator website](https://abru2009.github.io/EMC/main.html), choose your grade in settings, then open a chapter calculator. You can also jump directly to the Grade 10–12 hubs using the links above.

## Run it on your computer

EMC is a static website built with HTML, CSS, and JavaScript. No package installation or build step is required.

1. Download or clone this repository.
2. Open `main.html` in a browser, or start a local web server from the project folder:

   ```bash
   python3 -m http.server 8000
   ```

3. Visit <http://localhost:8000/main.html>.

## Project map

| Path | What you’ll find |
|:--|:--|
| `main.html` | Home page, grade settings, and featured textbook section |
| `calculators.html` | Searchable library of chapter calculators |
| `grade-10/`, `grade-11/`, `grade-12/` | Grade hubs and calculator pages |
| `grade-calculators.js` | Shared Grade 11 and 12 calculator logic and visualizations |
| `styles.css`, `theme.css`, `grade-calculators.css` | Site, theme, and calculator styling |
| `data/` | Logo and NCERT textbook cover images |
| `credits.html` | Project credits |

## Tools used

- Claude
- ChatGPT
- GitHub Copilot
