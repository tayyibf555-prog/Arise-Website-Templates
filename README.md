# Arise Website Templates

A showroom of agency website templates. `index.html` shows a live preview of every site; click one to open it.

Five agency offers, each with two variants:

| Offer | `vsl` | `site` |
|---|---|---|
| AEO Agency | `sites/aeo/vsl/` | `sites/aeo/site/` |
| AI Website Agency | `sites/ai-website/vsl/` | `sites/ai-website/site/` |
| AI Solution Agency | `sites/ai-solution/vsl/` | `sites/ai-solution/site/` |
| Copywriting Agency | `sites/copywriting/vsl/` | `sites/copywriting/site/` |
| AI Lead Gen Agency | `sites/lead-gen/vsl/` | `sites/lead-gen/site/` |

- **vsl**: sales page built around a video sales letter
- **site**: standard agency website, no VSL

## Run locally

Plain static HTML, no build step:

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321.

## Structure

- `sites/registry.js`: the list of offers shown on the index page
- `sites/<offer>/assets/`: styles and scripts shared by that offer's two pages
- `sites/_shared/silk.js`: WebGL silk and ridge backgrounds (`<canvas data-silk="crimson">`)
- `sites/_shared/motion.js`: GSAP animations via data attributes (`data-split`, `data-count`, `data-rotate`, `data-stagger`, …)
- `sites/_shared/vendor/gsap/`: GSAP 3.15

## Before using a template for a client

All brand names, stats, prices and testimonials are placeholders. Each VSL player needs its video URL in `data-embed=""`.
