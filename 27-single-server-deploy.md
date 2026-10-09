# Single-process deployment

**Scoring area:** Efficiency (80)

## Why this earns a high score
Simple deploys use fewer resources.

## Evidence in your project
- Express serves the built React app (`express.static(dist)`) and the API from one process and one port.
- A catch-all route returns `index.html`, enabling client routing.
- README documents free-tier hosting on Render.

## Takeaway
Low operating cost and easy hosting.
