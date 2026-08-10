# Interactive profile implementation

## What this adds

The profile README remains readable on GitHub, while the banner opens a real interactive version hosted on GitHub Pages.

Interaction flow:

1. The visitor clicks the original **Byte Blob** mascot.
2. Every README element follows a curved path into the mascot's mouth.
3. A Canvas particle vortex reinforces the suction effect.
4. The mascot gulps, then spits out the final profile card.
5. The card reveals the GitHub avatar, short introduction, links, and a replay control.

## Architecture

- `docs/index.html`: semantic profile content and interaction states
- `docs/styles.css`: GitHub-inspired UI, mascot, responsive states, and reduced-motion handling
- `docs/app.js`: Web Animations API sequence and Canvas particle engine
- `assets/interactive-profile.svg`: static README entry banner
- `.github/workflows/pages.yml`: static GitHub Pages deployment

No framework or runtime dependency is required.

## Deployment

After this branch is merged:

1. Open **Settings → Pages** in the repository.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Run the `Deploy interactive profile to Pages` workflow, or push a change under `docs/`.
4. The expected URL is `https://kwakseongjae.github.io/kwakseongjae/`.

## Easy tuning points

- Interaction timing: `animateSuckable()` in `docs/app.js`
- Particle density: `spawnAccumulator += 4.2 * delta`
- Final copy: `.reveal-card` in `docs/index.html`
- Mascot appearance: `.mascot-*` rules in `docs/styles.css`
- README entry artwork: `assets/interactive-profile.svg`
