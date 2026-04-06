# Design System Document: Clinical Precision & Tonal Depth

## 1. Overview & Creative North Star: "The Clinical Sanctuary"
This design system moves away from the sterile, rigid "box-and-line" aesthetics of legacy medical software. Our Creative North Star is **"The Clinical Sanctuary."** We aim to create a digital environment that feels as calm and organized as a high-end private clinic. 

To achieve this, we reject "generic SaaS" layouts in favor of **High-End Editorial** structures. We use intentional asymmetry, generous white space, and sophisticated tonal layering. The interface should not feel like a database; it should feel like a curated, intelligent assistant. We prioritize "Breathing Room" over "Information Density," trusting that a focused user is more efficient than a crowded one.

---

## 2. Colors: Tonal Atmosphere
We use a Material-based logic to create a sophisticated, blue-focused palette that signals trust and surgical precision.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Traditional borders create visual noise and "trap" the user's eye. Boundaries must be defined through:
- **Background Color Shifts:** Placing a `surface-container-low` card on a `surface` background.
- **Tonal Transitions:** Using depth to signify the end of one content area and the start of another.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper or frosted glass.
- **Base Layer:** `surface` (#f7f9fb)
- **Secondary Workspaces:** `surface-container-low` (#f2f4f6)
- **Primary Content Cards:** `surface-container-lowest` (#ffffff)
- **High-Impact Overlays:** `surface-container-high` (#e6e8ea)

### The "Glass & Gradient" Rule
To elevate the platform, use **Glassmorphism** for floating elements (like the collapsible sidebar or modal headers). Use `surface` colors at 80% opacity with a `20px` backdrop-blur. 
**Signature Texture:** For primary CTAs, use a subtle linear gradient from `primary` (#005d90) to `primary_container` (#0077b6) at a 135-degree angle. This adds "soul" and depth that flat hex codes cannot provide.

---

## 3. Typography: Editorial Authority
We utilize a dual-font system to balance clinical readability with high-end brand authority.

*   **Display & Headlines (Manrope):** Chosen for its geometric modernism. Use `display-lg` and `headline-md` for dashboard summaries and patient names to provide a high-contrast, editorial feel.
*   **Body & Labels (Inter):** The workhorse. Inter provides exceptional legibility for medical records and data tables. 
*   **Hierarchy Note:** Use `on_surface_variant` (#404850) for secondary metadata to create a clear visual distinction from primary data in `on_surface` (#191c1e).

---

## 4. Elevation & Depth: The Layering Principle
We convey hierarchy through **Tonal Layering** rather than structural lines.

*   **The Layering Principle:** Place a `surface_container_lowest` (#ffffff) card on a `surface_container_low` (#f2f4f6) background. The 2-unit shift in lightness creates a "soft lift" that is felt rather than seen.
*   **Ambient Shadows:** For floating elements (Modals, Popovers), use a custom shadow: `0 20px 40px -10px rgba(0, 93, 144, 0.08)`. Note the use of a blue tint (from the `primary` color) instead of grey; this mimics natural light passing through a medical environment.
*   **The "Ghost Border":** If a separator is required for accessibility, use `outline_variant` (#bfc7d1) at **15% opacity**. It should be a whisper, not a statement.
*   **Glassmorphism:** Use `surface_bright` with a `backdrop-filter: blur(12px)` for the collapsible sidebar to allow patient data colors to subtly bleed through, integrating the navigation into the workspace.

---

## 5. Components: Clinical Primitives

### Buttons
- **Primary:** Gradient from `primary` to `primary_container`. Radius: `md` (0.75rem). No border. White text.
- **Secondary:** `secondary_container` (#c3e9f1) background with `on_secondary_container` (#466a71) text.
- **Tertiary:** Transparent background, `primary` text. Use for low-emphasis actions like "Cancel."

### Input Fields
- **Style:** Background `surface_container_lowest`. 
- **States:** On focus, transition the "Ghost Border" to 100% opacity of `primary`. Use a 4px outer glow of `primary_fixed` at 30% opacity.
- **Shape:** `DEFAULT` (0.5rem) roundedness.

### Cards & Lists
- **Rule:** **Forbid divider lines.** 
- **Execution:** Use `body-md` spacing (1rem) between list items. For complex data tables, use alternating row tints of `surface_container_low` and `surface_container_lowest`. 

### The Collapsible Sidebar
- **Collapsed:** 64px width, icons only (Lucide React).
- **Expanded:** 280px width. Use `surface_container_lowest` with a "Ghost Border" on the right edge. Navigation items should use `label-md` for text and a 4px `primary` vertical "pill" indicator for the active state.

### Clinical Progress Chips
- Use `tertiary_container` (#a95f00) with `on_tertiary_container` (#fff6f1) for "Pending" or "Warning" states. The warm ochre provides a sophisticated contrast to the cool blues of the system.

---

## 6. Do's and Don'ts

### Do
- **Do** use `xl` (1.5rem) rounded corners for large layout containers to soften the "software" feel.
- **Do** lean into asymmetry. For example, a wide patient history column next to a narrower "Quick Actions" sidebar.
- **Do** use `primary_fixed` for subtle background highlights behind important icons.

### Don't
- **Don't** use pure black (#000000) for text. Always use `on_surface` or `on_surface_variant`.
- **Don't** use 100% opaque borders to separate content. Let the background tones do the work.
- **Don't** use "Drop Shadows" on every card. Reserve elevation for interactive elements that "float" above the workspace.
- **Don't** crowd the interface. If a screen feels full, increase the padding values from `md` to `lg`.