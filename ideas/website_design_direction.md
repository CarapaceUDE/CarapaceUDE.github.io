# Carapace Website Design Direction

## Brand architecture

- **Carapace is the company**: consultancy, infrastructure partner, implementation team, licensor, and steward.
- **Cortex is the software**: the open-core, model-independent control plane Carapace builds, deploys, and manages., A useful shorthand is `Carapace : Cortex :: Microsoft : Office`.

Every page should preserve this distinction. Company actions use “Carapace.” Product capabilities use “Cortex.”

## Visual synthesis

The pitch deck provides the strongest visual language:, near-black navy canvas;, warm white typography with decisive copper highlights;, electric blue for control, routing, and system state;, green for verified or safe states;, violet reserved for the Discovery Sprint and expansion;, thin technical borders, luminous nodes, and hexagonal control-plane geometry;, diagrams that expose how work moves instead of generic decorative AI imagery.

The Cortex interface imagery adds quieter application surfaces: dense information inside calm, clearly bounded panels. The website combines these ideas by staying minimal at first glance and revealing deeper mechanics through dedicated pages, diagrams, and disclosure controls.

## Interaction principles

1. **Motion explains hierarchy.** Entrance motion is short and limited to opacity and transforms.
2. **Reduced motion is complete.** `prefers-reduced-motion` removes non-essential animation and canvas movement.
3. **Details stay under the surface.** Native `details` / `summary` controls hold secondary workflow explanations without hiding navigation or critical conversion information.
4. **One strong visual per section.** Deck imagery is cropped and framed; it is not used as a wallpaper behind competing copy.
5. **Glow has meaning.** Blue glow identifies the control layer. Copper signals action. Constant neon decoration is avoided.
6. **The page should work without motion.** Animation adds orientation, never comprehension.

## Shared system

- `assets/site.css` is the website-level visual system.
- `assets/site.js` owns navigation, progressive reveal, active-page state, and subtle hero response.
- `assets/cortex-bloom-bg.js` owns the atmospheric brain/network canvas and respects reduced-motion preferences., Pitch deck routes remain available at `/ideas/` and `/ideas/#slide-N`.

## Page roles

- **Home:** the strategic overview and clearest Carapace/Cortex distinction.
- **How We Help:** the Carapace engagement and Discovery Sprint.
- **Solutions:** workflow and capability examples powered by Cortex.
- **Cortex:** the software, architecture, security, routing, and operator controls.
- **Licensing:** Cortex usage rights provided by Carapace.
- **About:** the Carapace company, philosophy, and stewardship model.
