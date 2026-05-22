# Design System Document: Nurturing & Intuitive Editorial

## 1. Overview & Creative North Star: "The Living Journal"

The Creative North Star for this design system is **"The Living Journal."** 

We are moving away from the cold, clinical nature of traditional health trackers. Instead, we are building a digital sanctuary that feels like a high-end, tactile linen journal. This system rejects the "app-as-a-tool" mentality in favor of "app-as-a-companion." 

To break the "template" look, we utilize **Intentional Asymmetry**. Instead of perfectly centered grids, we allow for organic white space and overlapping elements. Soft, generous curves (`rounded-xl` and `rounded-lg`) mimic the fluid nature of biology. We avoid rigid boxes, opting for "islands" of information that float within a calming, tonal sea of cream and sage.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

This palette is designed to lower cortisol levels. It uses muted rose (`primary`) and sage green (`secondary`) to create an atmosphere of growth and empathy.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background shifts. 
*   *Example:* Place a `surface-container-low` (#f5f3f1) card atop a `surface` (#fbf9f7) background. The change in "weight" defines the container, not a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of layered fine papers. 
*   **Level 0 (Base):** `surface` (#fbf9f7) – The canvas.
*   **Level 1 (Sections):** `surface-container-low` (#f5f3f1) – For large content blocks.
*   **Level 2 (Interactive Elements):** `surface-container-highest` (#e3e3e0) – To pull focus to critical inputs.

### Glass & Gradient Signature
To provide a "soul" to the digital interface:
*   **Hero Gradients:** Use a subtle linear gradient from `primary` (#7b5556) to `primary-container` (#f7c5c5) at a 45-degree angle for header backgrounds or major CTAs.
*   **The Glass Effect:** For floating navigation or modal overlays, use `surface-container-lowest` at 80% opacity with a `backdrop-blur` of 20px. This allows the calming sage and rose tones to bleed through the edges.

---

## 3. Typography: Editorial Authority

We pair **Plus Jakarta Sans** (Display/Headlines) with **Be Vietnam Pro** (Body/Titles) to balance high-end editorial style with clinical legibility.

*   **Display (Plus Jakarta Sans):** Use `display-lg` (3.5rem) for high-impact cycle days or pregnancy weeks. The tight tracking and soft curves of Jakarta Sans feel modern yet approachable.
*   **Headline (Plus Jakarta Sans):** `headline-md` (1.75rem) should be used for daily insights. It speaks with authority but maintains a friendly "voice."
*   **Body (Be Vietnam Pro):** `body-lg` (1rem) is the workhorse. It features open counters and generous x-height, ensuring that even complex health data is easy to digest during stressful moments.
*   **Labels:** Use `label-md` (0.75rem) in `on-surface-variant` (#5e5f5d) for metadata. 

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "digital" for a nurturing experience. We use depth to imply physical presence.

*   **The Layering Principle:** Stack `surface-container-lowest` (#ffffff) cards onto a `surface-container` (#efeeeb) background. This creates a soft, natural lift that mimics stacked cardstock.
*   **Ambient Shadows:** For "Floating Action Buttons" or critical alerts, use a shadow with a 40px blur, 0px offset, and 6% opacity, tinted with `primary` (#7b5556). 
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use `outline-variant` (#b2b2b0) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Nurturing Primitives

### Buttons
*   **Primary:** Background: `primary` (#7b5556); Shape: `rounded-full`. Use `3.5rem` (spacing-10) height for mobile-first thumb ergonomics.
*   **Secondary:** Background: `secondary-container` (#daf8e8); Text: `on-secondary-container` (#466054).

### Data Visualization (The Cycle Ring)
*   **Implementation:** Avoid harsh pie charts. Use soft, thick paths (`12px` stroke) with `rounded` caps. 
*   **Color Logic:** Use `primary` for the follicular phase, `secondary` for the luteal phase, and `tertiary` for neutral days.

### Cards & Lists
*   **Anti-Pattern:** Never use horizontal divider lines.
*   **The "Living" List:** Separate list items using `spacing-3` (1rem) of vertical white space. Wrap each item in a `surface-container-low` card with a `1.5rem` (rounded-md) corner radius.

### Input Fields
*   **Styling:** No bottom lines or boxed borders. Use a `surface-container-high` (#e9e8e6) fill with `rounded-md` (1.5rem) corners. The label should float above in `label-md` Typography.

### Signature Component: The "Empathy Toast"
A floating notification using the **Glassmorphism** rule (80% `surface-container-lowest` + blur). It uses an icon in `primary` and a `body-md` message to provide gentle cycle reminders.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. If the left margin is `spacing-6`, try a `spacing-8` on the right for a bespoke, editorial feel.
*   **Do** use the `2rem` (rounded-lg) corner radius for large images or health tip cards to emphasize "softness."
*   **Do** use tonal shifts for hover/active states (e.g., shifting from `surface-container` to `surface-container-high`).

### Don't:
*   **Don't** use pure black (#000000) for text. Always use `on-surface` (#313331) to maintain the soft, low-contrast aesthetic.
*   **Don't** use "Alert Red" for warnings. Use `error_container` (#fa7150) which is a softer, salmon-toned error state that feels less alarming.
*   **Don't** use 90-degree corners. Everything in this system must have at least a `0.5rem` (rounded-sm) radius.