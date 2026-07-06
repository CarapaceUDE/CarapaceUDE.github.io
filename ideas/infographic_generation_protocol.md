# Carapace Infographic Generation Protocol

This document defines how we turn website copy into deck-like infographic images that feel native to the Carapace/Cortex visual system.

The goal is not "make a pretty picture." The goal is to translate business workflow ideas into images that explain structure, motion, control, and outcomes at a glance.

## Core rule, Carapace is the company., Cortex is the software., Images should show Cortex as the control layer and Carapace as the builder, deployer, and steward behind it.

If an image confuses those roles, it fails.

## Visual grammar

Every infographic should inherit these deck traits:, near-black navy field;, warm white type;, electric blue for routing, control, or system logic;, copper for human action, business leverage, or commercial impact;, green for verified, safe, or approved states;, thin borders and geometric structure;, visible flow lines, nodes, stacks, or bounded zones;, minimal text, strong hierarchy, no stock-photo energy.

Avoid generic AI art, smiling teams, floating holograms, random robots, and abstract "tech wallpaper."

## Source-to-image workflow

Use this conversion sequence every time.

### 1. Distill the message

Reduce the source text to:, one headline idea;, one system action;, one business result;, up to three supporting proof points.

If the source block cannot be summarized that tightly, it is not ready for image generation yet.

### 2. Identify the visual model

Choose one dominant visual pattern:, routing map;, before/after process strip;, layered stack;, protected boundary;, approval gate;, signal flow;, operator dashboard slice;, workflow compression;, capability roster.

One image gets one primary model. Mixing two strong metaphors usually muddies the result.

### 3. Translate text into visible objects

Convert each abstract claim into a visible thing:, "follow-up slips" -> stalled nodes, broken handoff, dim queue, "routing" -> branching paths, tagged destinations, decision points, "approval" -> human checkpoint, signed gate, visible hold state, "knowledge reuse" -> indexed document cluster, retrieval beam, summary output, "hours saved" -> compressed timeline, reduced steps, fewer manual touches

### 4. Assign hierarchy

The image must read in this order:

1. title or focal claim
2. the mechanism
3. the payoff
4. the proof details

### 5. Generate, review, and tighten

Reject outputs that are decorative, vague, text-heavy, or impossible to crop cleanly on mobile.

## Protocol A: Bubble / Card Infographics

Use this when the image lives inside a card, carousel slide, or bounded panel.

### Use case, solutions cards, feature tiles, comparison bubbles, hover-reveal content blocks, stacked mobile cards

### Composition rule

Contained, vertical, self-sufficient. The image should feel like a complete instrument panel, not a cropped banner.

### Master size, generate at `1600 x 2000`, aspect ratio `4:5`, export target `1200 x 1500` or larger

### Safe zones, keep all essential content inside the center `78%` of the canvas, leave at least `10%` top and bottom breathing room, do not place critical text closer than `9%` to any edge

### Layout pattern, top: short headline or label, middle: main mechanism diagram, bottom: 2 to 3 compact proof points, tags, or outcomes

### Text density, ideal on-image text: `8 to 18 words`, hard ceiling: `24 words`, labels should be short and structural, not paragraph copy

### Bubble prompt template

```text
Create a contained infographic panel for the Carapace website in the Carapace/Cortex pitch deck style.

Subject:
[one-sentence concept]

Visual model:
[routing map / approval gate / layered stack / dashboard slice / workflow compression]

Required message:
[what the image must communicate at a glance]

Show:
- [object or signal 1]
- [object or signal 2]
- [object or signal 3]

Business outcome:
[time saved / less dropped work / better oversight / reusable system]

Art direction:
dark navy technical background, warm white labels, electric blue routing lines, copper action accents, green approval or safe-state signals, crisp geometric panels, subtle glow, no stock-photo elements, no generic AI imagery

Composition:
vertical 4:5 panel, self-contained, centered focal structure, clean edge margins, mobile-safe crop, readable at small size

Text on image:
[headline]
[label 1]
[label 2]
[label 3]

Avoid:
clutter, long paragraphs, photorealistic people, random icons, floating holograms, visual noise, empty decorative circuitry
```

## Protocol B: Breakout / Full-Width Infographics

Use this when the image breaks out of a card and carries a whole section.

### Use case, feature breakouts, process explanation sections, architecture explainer bands, trust/security proof sections, homepage or solutions full-width story moments

### Composition rule

Panoramic on desktop, center-safe on mobile. The important story must survive both a wide crop and a tall crop.

### Master size, generate at `2400 x 1600`, working aspect ratio `3:2`, export target `1800 x 1200` or larger

This is intentionally not ultra-wide. It preserves enough height for mobile cropping.

### Safe zones, treat the middle `56%` width as the mobile-safe narrative band, keep the headline, main mechanism, and payoff inside that center band, use the outer left and right edges for secondary atmosphere, peripheral nodes, or extended flow

### Responsive crop targets, desktop section render: `3:2` or `16:9`, mobile section render: crop the same image to `4:5`

The image prompt must therefore describe a centered composition with expandable wings, not a left-to-right story that dies when cropped.

### Layout pattern, center: mechanism or flow spine, left/right: supporting inputs, outputs, destinations, or environmental signals, one strong title region, one obvious business payoff region

### Text density, ideal on-image text: `6 to 16 words`, hard ceiling: `20 words`

### Breakout prompt template

```text
Create a breakout infographic for the Carapace website in the Carapace/Cortex pitch deck style.

Subject:
[one-sentence concept]

Visual model:
[control plane / routed workflow / trust boundary / operating layer / before-after compression]

Required message:
[what must be clear in three seconds]

Show:
- [left-side input or pressure]
- [center control or transformation]
- [right-side result or routed destinations]

Business outcome:
[clear result]

Art direction:
dark navy system canvas, warm white typography, electric blue system logic, copper for human and business action, green verified state markers, thin panel borders, subtle glow, diagram-led composition, refined and high-contrast

Composition:
3:2 master image, central mobile-safe story band, panoramic wings that can crop cleanly, strong central focal path, works as desktop full-width visual and mobile 4:5 crop

Text on image:
[headline]
[label 1]
[label 2]
[label 3]

Avoid:
tiny labels, edge-dependent storytelling, empty background filler, busy UI overload, generic "future tech" visuals
```

## Image brief worksheet

Before prompting, fill this out:, page:, section:, placement type: `bubble` or `breakout`, source text:, one-line message:, system action:, business payoff:, visual model:, required objects:, allowed labels:, palette emphasis: `blue / copper / green / mixed`, crop risk:

If the worksheet is weak, the prompt will be weak.

## Quality gate

Approve an image only if all are true:, it explains a system, not just a mood;, it clearly belongs to the deck family;, it survives thumbnail size;, it crops cleanly on mobile;, it does not over-explain with text;, it reinforces Carapace company / Cortex software separation;, it gives the page more clarity than the bubble box it replaces.

## Practical implementation notes, Bubble assets should be rendered into `4:5` containers., Breakout assets should be authored from a `3:2` master, then displayed with responsive crops., Use one image per concept, not one image trying to summarize the whole page., When a section contains three or more related cards, use a shared visual system across them: same horizon line, same label style, same node language, same accent behavior.

## Recommended first targets on the current site, Solutions: replace the workflow carousel cards with six bubble infographics., Solutions: replace "Discover -> Deploy -> Measure -> Expand" with one breakout process graphic., Cortex: replace feature boxes with bubble infographics showing routing, oversight, and inspectability., Home: add one breakout image for "Control the destination, not the vendor."
