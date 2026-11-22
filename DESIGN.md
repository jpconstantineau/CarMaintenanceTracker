---
version: alpha
name: CarMaintenanceTracker
description: A restrained vehicle-history interface with neutral light and dark themes.
colors:
  primary: "#202020"
  secondary: "#595959"
  neutral: "#F5F5F5"
  surface: "#FFFFFF"
  hover: "#E6E6E6"
  warning: "#805500"
  warning-surface: "#FFF4D6"
  error: "#B3261E"
  error-surface: "#FFF0EE"
  dark-primary: "#EDEDED"
  dark-secondary: "#B8B8B8"
  dark-neutral: "#121212"
  dark-surface: "#1E1E1E"
  dark-hover: "#303030"
  dark-warning: "#F0C674"
  dark-warning-surface: "#302719"
  dark-error: "#FFB4AB"
  dark-error-surface: "#36201E"
typography:
  headline-lg:
    fontFamily: sans-serif
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0em
  headline-md:
    fontFamily: sans-serif
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0em
  body-md:
    fontFamily: sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  label-md:
    fontFamily: sans-serif
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0em
  reading:
    fontFamily: sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
    fontFeature: '"tnum" 1'
rounded:
  none: 0px
  sm: 4px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  control: 0.75rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  phone-target: 44px
components:
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    padding: "{spacing.md}"
  page-dark:
    backgroundColor: "{colors.dark-neutral}"
    textColor: "{colors.dark-primary}"
    typography: "{typography.body-md}"
    padding: "{spacing.md}"
  supporting-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.body-md}"
  supporting-text-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-secondary}"
    typography: "{typography.body-md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.control}"
  button-primary-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.control}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.control}"
  input-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.control}"
  selection-row-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.control}"
  selection-row-hover-dark:
    backgroundColor: "{colors.dark-hover}"
    textColor: "{colors.dark-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.control}"
  warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.control}"
  warning-dark:
    backgroundColor: "{colors.dark-warning-surface}"
    textColor: "{colors.dark-warning}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.control}"
  error:
    backgroundColor: "{colors.error-surface}"
    textColor: "{colors.error}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.control}"
  error-dark:
    backgroundColor: "{colors.dark-error-surface}"
    textColor: "{colors.dark-error}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.control}"
---

# Design System: CarMaintenanceTracker

## Overview

A calm, utilitarian interface for people maintaining their own vehicles. Phone screens support entering known facts beside the car; desktop screens support scanning and comparing history. Information is moderately compact, with clearly separated touch targets and a strong reading hierarchy. Ordinary activity stays visually quiet so conditions needing action stand out.

This design is based on the agreed requirements. The tokens above give concrete values to those requirements. Follow the [purposeful-web-design skill](.agents/skills/purposeful-web-design/SKILL.md) when deciding which elements belong on a screen and recording their purpose.

## Colors

The palette follows an ISA-101-inspired philosophy: neutral routine information, consistent state meanings, and conspicuous color reserved for actionable problems. These hexadecimal values are project choices, not an ISA-prescribed palette or a claim of formal conformance. [Research and primary sources](documentation/research/design-standards.md).

Unsuffixed component names and color tokens describe the light theme. Their `-dark` component and `dark-` color counterparts describe the dark theme; pair each component with its complete theme palette.

| Role | Light theme | Dark theme | Use |
| --- | --- | --- | --- |
| Primary | Charcoal `#202020` | Soft white `#EDEDED` | Main text, neutral primary actions, selection marks, and focus outlines. |
| Secondary | Graphite `#595959` | Silver gray `#B8B8B8` | Supporting text, input outlines, and necessary separators. |
| Neutral | Paper gray `#F5F5F5` | Near-black `#121212` | Page background. |
| Surface | White `#FFFFFF` | Dark gray `#1E1E1E` | Input interiors and justified contained regions. |
| Hover | Pale gray `#E6E6E6` | Raised gray `#303030` | Hovered or selected rows; accompany persistent selection with a border or marker. |
| Warning | Dark amber `#805500` on pale amber `#FFF4D6` | Muted amber `#F0C674` on dark brown `#302719` | A condition requiring attention, paired with its relevant action. |
| Error | Brick red `#B3261E` on pale red `#FFF0EE` | Pale red `#FFB4AB` on dark red `#36201E` | Failed operations and invalid input, paired with a correction or retry. |

Successful saves, missing history, unknown mileage, and insufficient evidence remain neutral. State wording carries the meaning; color reinforces it. Primary buttons use inverted neutral contrast, not an attention color.

### Theme behavior

A compact, visibly labeled System / Light / Dark control sits in the app header. System is the initial choice and follows changes to the device preference. Remember the choice on the current device; explicit Light or Dark overrides the system until changed. Switching themes preserves the current screen, selected vehicle, keyboard focus, and unfinished input.

## Typography

Use the browser's default sans-serif family throughout, including native controls. No fonts are downloaded. Normal letter spacing and sentence case keep labels familiar; weight and size establish hierarchy without decorative type treatments.

- `headline-lg`: 1.5rem, weight 600, line height 1.25. Identifies the page or selected vehicle while fitting phone widths.
- `headline-md`: 1.25rem, weight 600, line height 1.3. Separates meaningful sections without overpowering their data.
- `body-md`: 1rem, weight 400, line height 1.5. Used for prose, values, helper text, and editable input.
- `label-md`: 1rem, weight 600, line height 1.5. Associates labels and action names with controls without shrinking essential text.
- `reading`: body-sized text with tabular numerals when supported by the installed font. Align comparable readings in tables without introducing a separate monospaced typeface.

Honor the browser's root font-size preference. Text containers grow when content wraps or text is enlarged; neither labels nor controls use a fixed text height. The 1rem starting point is a project choice, not a WCAG minimum font-size rule.

## Layout

Use one clear entry column on phones, compact vehicle lists for selection, and aligned summaries or tables for review. Wider screens may use additional columns when the information benefits from comparison. Determine breakpoints from content fit; there is no compulsory dashboard grid.

The spacing tokens express relationships: `xs` keeps a label or error near its field; `sm` separates tightly related controls; `control` gives inputs and buttons internal clearance; `md` provides phone edge clearance and separation between fields; `lg` and `xl` separate larger groups. Start phone page margins at `md`; larger layouts can use `lg` where the additional space improves scanning. Keep label-to-field distance smaller than field-to-field distance.

Standalone phone controls have a minimum interactive area of `phone-target`, 44 by 44 CSS pixels, including an associated clickable label where applicable. This is a minimum, not a fixed size: controls expand for enlarged text. Forms and surrounding content reflow at 320 CSS pixels wide without horizontal page scrolling. Essential two-dimensional tables may have their own accessible scrolling region.

## Elevation & Depth

The interface is flat. Establish hierarchy with headings, alignment, spacing, and neutral contrast. A distinct surface or simple border is used only when it clarifies a functional group. Do not put every section in a card. Decorative shadows and gradients are absent.

## Shapes

Rectangular controls have slightly softened, 4px corners (`rounded.sm`). This is enough to separate their outlines cleanly while retaining a compact technical appearance. Table rows and uncontained lists have square edges (`rounded.none`). If a group genuinely needs a container, use the same small radius. Native radio circles and checkbox geometry retain their recognizable form.

## Voice & Content Strategy

Use short, factual, action-oriented wording and the terms in [GLOSSARY.md](GLOSSARY.md). Labels name the outcome, such as “Add vehicle” or “Save changes.” Display units with readings, preserve date precision, and identify estimates explicitly.

Every message must support a current action or decision in its actual location. A label or status that already communicates the necessary information makes a second explanation unnecessary. Taglines, development roadmaps, and general precautionary footers do not belong on task screens. Put useful help at the point where the user needs it.

Unknown information is stated neutrally and never presented as zero. Errors explain what failed and how to correct or retry it while retaining editable work. “Saved on this device” and a future remote-save confirmation describe different outcomes; show each only after its operation succeeds.

## Components

### Buttons and navigation

The primary action uses the theme's primary fill and surface-colored text, label typography, small corners, and `control` padding. Secondary actions use the input/surface treatment with a simple 1px secondary-colored outline. Neutral tonal changes identify hover and pressed states; focus uses a 3px primary-colored outline offset by 3px so it remains distinct from the control edge. State changes do not alter layout or move neighboring targets.

The theme selector remains compact but meets the phone target minimum. All choices have visible names and keyboard access. Vehicle selection uses a readable list of full-row targets, not a grid of decorative cards; persistent selection includes a marker or border in addition to its neutral background.

### Inputs and forms

Place a visible label before each text input and associate it programmatically. Use the theme's surface, primary text, a 1px secondary-colored border, small corners, and `control` padding. Group native radio or checkbox choices with their labels; keep their checked state visible in neutral colors. Notes use a multi-line textarea that remains resizable.

Mark required and optional information plainly. Validation appears after submission or an appropriate completed interaction, next to its field, and clears when corrected. Apply error color with linked explanatory text. Preserve editable input on storage or network failure.

### History, summaries, and charts

Use headings and aligned label/value pairs for a small summary; use tables when comparing many records. Keep routine values, units, successful statuses, and missing evidence neutral. A concise inline error is preferred when it explains one affected field; the error/warning surface tokens are available when the message needs a distinct task-level region.

Charts must answer a concrete history or forecast question. Label series directly and use markers or line styles so their meaning survives without color. Represent recorded points and estimates distinctly; smoothing must not conceal recorded changes. Containers and charts are added for their information value, not to fill a dashboard template.

## Do's and Don'ts

- Do apply the complete light or dark palette and verify both themes, including hover, selection, focus, errors, and unfinished entry during theme switching.
- Do target WCAG 2.2 AA, with the additional project choice of 44px standalone phone targets. Preserve 200% text enlargement and user text-spacing overrides. Verify at least 4.5:1 ordinary-text contrast, 3:1 qualifying large-text contrast, and 3:1 necessary non-text contrast against adjacent colors, with the criteria's exceptions.
- Do keep the actual element/style purpose ledger and test phone and desktop tasks, long content, keyboard access, and relevant accessibility states. Use the [WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/) and [standards research](documentation/research/design-standards.md) for the full criteria; token contrast checks alone are not an accessibility audit.
- Don't use strong warning or error colors for routine controls, normal readings, successful saves, or missing evidence.
- Don't add cards, downloaded fonts, gradients, shadows, or explanatory copy merely to make a screen appear finished.

Format reference: [Stitch DESIGN.md specification](https://stitch.google.com/docs/design-md/specification/). The concrete palette, typography, spacing, and shape values implement the user's agreed direction. Implementation checks are recorded in the [UI purpose and verification ledger](documentation/vehicle-ui-ledger.md).
