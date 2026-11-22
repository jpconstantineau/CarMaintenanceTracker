# Design standards research

Research date: 2026-11-21. Purpose: inform the design interview; these findings do not approve a palette or implement UI changes.

## ISA-101 and color

ISA identifies ANSI/ISA-101.01-2015 as the core standard for human-machine interfaces in process automation. Its supporting technical report ISA-TR101.01-2022 addresses HMI philosophy. This industrial scope differs from a personal maintenance-history application. [ISA: ISA-101 series](https://www.isa.org/standards-and-publications/isa-standards/isa-101-standards)

The accessible ISA-published article *How to Maximize Operator Effectiveness with a High-Performance HMI* advocates consistent, sparing color; muted backgrounds; bright colors for abnormal situations; and redundant shape/text/color indicators. Alarm colors should retain their meaning rather than appearing throughout routine information. This is explanatory guidance, not the normative standard text. [ISA article, now on Automation.com](https://www.automation.com/article/the-high-performance-hmi)

The ISA-hosted PAS paper *High Performance Graphics to Maximize Operator Effectiveness* likewise recommends a limited, consistent palette, additional cues beyond color, and reserving conspicuous colors for abnormal situations (page 9). The paper is by Bill Hollifield and Hector Perez, copyright PAS 2012; hosting on ISA's website does not make it an ISA standard. [ISA-hosted PAS paper](https://www.isa.org/getmedia/06130a38-f7af-4b35-8c9c-2c34f25c1977/The-High-Performance-HMI-Overview-v2-01.pdf)

**Project interpretation:** describe the approach as an **ISA-101-inspired color philosophy**. Use neutral surfaces and readable neutral text for ordinary history, explicit words for states, and restrained semantic color where attention is needed. The sources reviewed do not establish a mandatory hexadecimal palette, a required light/dark theme pair, or conformance/certification for this app. The full normative standard was not assessed.

Both themes can preserve the same semantic roles while using different tested color values. Avoid treating a missing record, old observation, or uncertain estimate as an emergency solely because information is absent. Those are domain decisions for the interview, not conclusions supplied by ISA.

## WCAG 2.2 sizing and appearance

WCAG's Recommendation is normative; W3C's linked Understanding documents explain its success criteria and are informative. This is a selected design checklist, not a complete accessibility audit. [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)

| Concern | Verified guidance |
| --- | --- |
| Pointer targets, AA | SC 2.5.8 sets a minimum of **24 × 24 CSS pixels**. Exceptions cover sufficient spacing, an equivalent control, inline targets, unmodified user-agent controls, and essential presentation. The spacing exception uses a 24px-diameter circle centered on each undersized target: it must not intersect another target or another undersized target's circle. This is not a blanket 24px gap rule. [W3C: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| Larger targets, AAA | SC 2.5.5 specifies **44 × 44 CSS pixels**, with equivalent-control, inline, user-agent, and essential exceptions. It has no general spacing exception. This is a useful phone design target even when the overall goal is AA. Meeting this one criterion does not establish overall AAA conformance. [W3C: Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) |
| Text enlargement, AA | SC 1.4.4 requires text enlargement up to **200%** without losing content or functionality, except captions and images of text. Labels and text in controls are included. [W3C: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) |
| Narrow layout, AA | SC 1.4.10 requires vertically scrolling content to work at **320 CSS pixels wide** without losing information/functionality or requiring scrolling in both dimensions. Essential two-dimensional content has exceptions. This corresponds to a 1280px-wide viewport at 400% zoom; it does not mean every phone is 320 physical pixels wide. [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |
| Font size | WCAG 2.2 does **not prescribe a universal minimum body font size**. This is a reading of the criteria, not an explicit recommended font size. Font size, enlargement, reflow, and contrast must be considered together. The standard's large-text thresholds affect contrast requirements; they are not minimum body-text sizes. [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Text contrast, AA | SC 1.4.3 requires **4.5:1** for ordinary text and **3:1** for large text, with stated exceptions. Large text is at least 18pt regular or 14pt bold (approximately 24 CSS px or 18.67 CSS px respectively). Apply the appropriate requirement in each theme. [W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Non-text contrast, AA | SC 1.4.11 requires **3:1 against adjacent colors** for visual information necessary to identify controls/states and understand graphics, with exceptions. Not every decorative border requires 3:1, nor must nonadjacent hover/default colors contrast 3:1 with each other. [W3C: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) |
| Color cues, A | SC 1.4.1 prohibits color as the only visual means of conveying information, indicating actions, prompting responses, or distinguishing elements. Explicit status text and appropriate shapes can supplement color. [W3C: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) |
| Text spacing, AA | SC 1.4.12 requires the content to survive user overrides of line height to 1.5× font size, paragraph spacing to 2×, letter spacing to 0.12×, and word spacing to 0.16× without losing content/functionality. These are override tolerances, not mandatory default styling. [W3C: Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) |
| Focus and overlays, AA | SC 2.4.11 requires a focused component not to be entirely hidden by author-created content. Sticky headers/footers must be assessed at small widths and zoom. Keeping the whole focused control visible is the stronger design choice. [W3C: Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) |

## Decision handoff

The interview is complete. [DESIGN.md](../../DESIGN.md) records the agreed project requirements, including neutral routine states, System / Light / Dark behavior, default sans-serif fonts, and 44 × 44 CSS-pixel standalone phone targets. Use that guide as the source of truth for project choices; use this note for standards explanations and source limitations.
