# Design System Specification: The Polished Luminary

## 1. Overview & Creative North Star
This design system is built upon the **"Polished Luminary"** creative north star. It is an editorial approach to data management that rejects the sterile, "out-of-the-box" dashboard aesthetic in favor of a high-fidelity, layered experience. 

The system creates a sophisticated tension between a high-contrast dark sidebar and a soft, luminous main stage. We move beyond traditional grids by utilizing **intentional white space** and **asymmetrical layouts** that guide the eye toward "Achievement Numbers." This isn't just a tool; it is a premium canvas where data feels curated, not just displayed.

---

## 2. Colors & Surface Logic
The palette is anchored by deep professional neutrals and energized by high-chroma accents.

### The Foundation
*   **Background (`#f5f6f7`):** A soft, textured neutral that serves as the stage.
*   **Primary (`#2a4bd9`):** Our "Deep Blue" used for core branding and high-priority actions.
*   **Secondary (`#b4005d`):** A "Magenta" used for secondary metrics and status highlights.
*   **Tertiary (`#00694c`):** An "Emerald Green" reserved for success states and growth indicators.

### The "No-Line" Rule
To achieve a signature editorial feel, **prohibit the use of 1px solid borders for sectioning.** Boundaries must be defined through background shifts or tonal transitions.
*   Use `surface_container_low` for large content areas sitting on the `background`.
*   Use `surface_container_lowest` (#ffffff) for card-level components to create a "lifted" appearance without needing a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
1.  **Level 0 (Base):** `surface`
2.  **Level 1 (Sections):** `surface_container`
3.  **Level 2 (Cards):** `surface_container_lowest`

### The "Glass & Gradient" Rule
Floating elements (such as tooltips or dropdowns) should utilize **Glassmorphism**. Use semi-transparent surface colors with a `20px` backdrop blur. For primary CTAs, apply a subtle linear gradient from `primary` to `primary_container` to add "soul" and depth.

---

## 3. Typography
Our typography creates an authoritative hierarchy that feels modern and refined.

*   **Display & Headlines (Plus Jakarta Sans):** This is our "Editorial" voice. Use these for main titles and achievement numbers. These should feel bold, spacious, and premium.
*   **Body & Labels (Inter):** Our "Functional" voice. This provides maximum legibility for data-heavy tables and metadata.

**Achievement Numbers:** These are the heart of the dashboard. Use `headline-lg` or `display-sm` for these values. They should be bolded and paired with a high-chroma accent color (e.g., `secondary` for a target percentage) to stand out immediately.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than structural lines.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft, natural lift.
*   **Ambient Shadows:** For floating elements, use extra-diffused shadows.
    *   *Token Example:* `box-shadow: 0 12px 40px rgba(44, 47, 48, 0.06);` (Using a tinted version of `on_surface`).
*   **The "Ghost Border" Fallback:** If a boundary is strictly required for accessibility, use the `outline_variant` token at **10% opacity**. Never use 100% opaque borders.
*   **Glowing Edges:** For progress bars and charts, apply a subtle outer glow using the accent color's `_dim` variant to mimic consistent, high-end lighting.

---

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`rounded-full`), using a gradient from `primary` to `primary_dim`. Text is `on_primary`.
*   **Tertiary:** Ghost style. No background or border. Use `primary` for the text label and a subtle `surface_container` background on hover.

### Progress Bars & Charts
*   **Linear Progress:** Must be pill-shaped (`rounded-full`). Use `surface_container_highest` for the track and a vibrant accent (Blue, Magenta, or Emerald) for the fill.
*   **Donut Charts:** Apply a glossy finish using a 10% white overlay on the top half of the segment to simulate light hitting a glass surface.

### Input Fields
*   **Text Inputs:** Use `surface_container_low` for the fill. No border. On focus, add a 2px `primary` shadow (not a border) to indicate activity.

### Cards & Lists
*   **Spacing:** Use the Spacing Scale `6` (1.5rem) or `8` (2rem) for internal padding.
*   **Separation:** Forbid divider lines. Separate list items using a `4px` vertical gap (Spacing Scale `1`) or alternating tonal shifts between `surface_container_lowest` and `surface_container_low`.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use `plusJakartaSans` for all major numerical achievements to give them a "designed" feel.
*   **Do** allow elements to overlap slightly (e.g., an icon breaking the container edge) to create a custom, non-template look.
*   **Do** use `surface_bright` to highlight the most critical interaction point on the page.

### Don't:
*   **Don't** use pure black for shadows. Always tint shadows with the `on_surface` color to maintain a professional, soft aesthetic.
*   **Don't** use the `DEFAULT` (0.5rem) roundedness for everything. Use `xl` (1.5rem) for major containers and `full` for progress bars to maintain the "Sleek Pill" theme.
*   **Don't** clutter the sidebar. The dark sidebar is a "void" intended to focus the user's attention on the vibrant content of the main stage. Use `on_surface_variant` for inactive nav items.