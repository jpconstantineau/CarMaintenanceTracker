---
name: grill-ui-philosophy
description: >
  Relentlessly interview the user to build a bespoke, opinionated UI Design
  Philosophy by mixing and matching proven interaction, hierarchy, and safety
  patterns. Produces a concrete UI_DESIGN_PHILOSOPHY.md artifact ready for
  wireframing and component design.
---

Call the Skill tool twice, for "grilling" and "domain-modeling".

Interview the user relentlessly until you have constructed a complete,
contradiction-free **UI Design Philosophy** tailored to their product.

Your job is to help the user consciously pick and choose specific architectural
and interaction components—without ever naming, citing, or referencing external
industry standards, regulatory bodies, or acronyms. Present every choice in
plain product, cognitive, and UX terms.

## Rules of Engagement

1. **Ask in rounds (the frontier):** Only ask questions whose prerequisites are
   settled. Never ask about Level 3 form fields before Level 1 and Level 2
   navigation and user tasks are settled.
2. **Always offer concrete options + a recommendation:** For each decision,
   present 2–4 distinct patterns with brief trade-offs, and state which one you
   recommend based on what you know about their product so far.
3. **Resolve dependencies:** Let earlier answers shape later questions. (For
   example, if the user chooses a single layered workspace, follow up on how
   users reset clutter; if the user's app manages multiple entities, grill them
   on preventing mix-ups.)
4. **Call out contradictions:** If the user wants two things that fight each
   other (e.g., "2-second glanceability" AND "dense multi-layer data on one
   screen"), stop and force them to pick a tiebreaker rule.
5. **Stay concrete:** Anchor abstract choices to a real screen or task in the
   user's app.

---

## The Decision Tree

Walk through these 6 areas in order. Skip or compress sub-questions only if an
earlier answer already settles them.

### Phase 1: Context, Environment & Risk Profile
Before picking UI patterns, establish the constraints:
- What is the product, and what is the **single most frequent task** vs. the
  **highest-stakes task**?
- **Environment & attention:** Are users sitting calmly at a desk, multitasking
  in a busy environment, or glancing at the screen on the go?
- **Cost of error:** What happens if a user misreads a number or taps the wrong
  button? (Minor annoyance, wasted money, or serious real-world consequence?)

### Phase 2: Screen Architecture & Navigation
Help the user choose how screens relate to each other:
- **Primary structure:**
  - *Shallow Task Tree:* 2–3 levels max, grouped by user task, with persistent
    orientation (breadcrumbs/tabs) and a 1-tap return to overview.
  - *Layered Workspace:* One primary screen where users toggle extra data
    layers on/off instead of navigating away.
  - *Ultra-Flat Cards:* 1–2 levels max, chunked into oversized cards/lists with
    minimal scrolling.
  - *Pinned Split-Screen:* A permanent, always-visible overview/status panel
    locked alongside the active working area to prevent "keyhole" tunnel vision.
- **Follow-ups based on choice:**
  - If *Layered Workspace*: Should there be a 1-tap "Reset to Clean View"
    button? What is the non-removable baseline that can never be hidden?
  - If *Shallow Tree* or *Split-Screen*: What belongs on Level 1 (Overview) vs.
    Level 2 (Functional) vs. Level 3 (Detail)?

### Phase 3: Visual Hierarchy, Color & Glanceability
Define how the interface communicates at a glance:
- **Color philosophy:**
  - *Muted Baseline (Color = Exception):* Neutral grays/whites when normal;
    color appears *only* to signal abnormal states or required action.
  - *Expressive / Semantic:* Brand and category colors used throughout for
    warmth and visual grouping.
- **Glance budget:** Must key screens be understood in a 2-second glance (bold
  primary value, minimal prose), or is rich, scannable density acceptable?
- **Lighting & ergonomics:** Do users need calibrated environment themes
  (e.g., high-contrast daylight vs. low-glare dark/night) or oversized touch
  targets for imprecise tapping?

### Phase 4: Alerts, Status & Data Trust
Define how the app handles problems and uncertainty:
- **Alert tiers:** Should alerts be strictly tiered (e.g., Critical / Caution /
  Advisory) with distinct visual treatments?
- **Acknowledgment & snoozing:**
  - Should alerts distinguish between *Unacknowledged* (prominent) and
    *Acknowledged* (quiet/tracked) until resolved?
  - If users can snooze an alert, must a persistent "Snoozed" indicator remain
    visible so it cannot be silently forgotten?
- **Data quality & staleness:** If data is old, estimated, or manually
  overridden, should the UI explicitly flag it (e.g., a `STALE` or `?` badge)
  and restrict predictions until verified?
- **Formatting rigor:** Should the app enforce zero-ambiguity formatting
  (e.g., explicit units next to every number, unambiguous dates like
  `05 Apr 2026` instead of `04/05/26`)?

### Phase 5: Viewing vs. Acting (Workflows & Error Guardrails)
Define how users input or change data:
- **Read vs. Write separation:** Should the primary overview be strictly
  read-only (monitoring) with editing isolated into dedicated flows, or allow
  quick inline edits?
- **Workflow style:**
  - *Fast Defaults:* Pre-filled values and 1-tap presets for high-frequency
    logging.
  - *Guided Step-by-Step:* Structured sequences ending in a dedicated Review &
    Confirm screen.
  - *Interactive Checklists:* Task-based procedures with explicit place-keeping
    (*Not Started / In Progress / Done*) and embedded reference data.
- **Guardrails:**
  - *Soft & Hard Input Limits:* Warn on suspicious values (e.g., typos/outliers)
    and block impossible ones without an explicit override.
  - *Verify-Before-Execute:* Two-step confirmation or evidence attachment for
    high-consequence actions.
  - *Entity Mix-Up Prevention:* If tracking multiple items/accounts/entities,
    should a persistent, color-coded identity banner stay locked across every
    screen?

### Phase 6: Modes, Interruptions & Configuration
Define how the app adapts to user state:
- **Operational modes:** Does the app need distinct modes—such as *Monitoring*
  (right now) vs. *Planning* (what-if/future), or *Quick/On-the-Go* (simplified,
  voice/preset-first) vs. *Full/Stationary*?
- **Interruptibility:** If a user gets pulled away mid-task, must the app
  indefinitely preserve and resume their exact state?
- **Protected configuration:** Should rule-changing settings (thresholds,
  schedules, deletions) be isolated behind a deliberate barrier away from daily
  screens?

---

## Final Deliverable

Once every branch is resolved and all contradictions are settled, generate a
crisp, opinionated **`UI_DESIGN_PHILOSOPHY.md`** containing:

1. **Core Thesis:** A 2–3 sentence summary of the philosophy and who it serves.
2. **Non-Negotiable Principles:** 5–7 sharp rules derived from the interview.
3. **Architecture & Layout Rules:** Exact hierarchy depth, persistent elements,
   and navigation mechanics.
4. **Visual & Attention Rules:** Color usage, glanceability targets, formatting,
   and density limits.
5. **Interaction, Safety & Alert Rules:** Read/write separation, guardrails,
   alert lifecycle, and data-staleness handling.
6. **Modes & Edge Cases:** Interruptibility, operational modes, and protected
   settings.
7. **Conflict Tiebreakers:** 3–4 explicit "When X conflicts with Y, X wins"
   rules to guide the next phase of wireframing and UI design.

Ask the user to confirm or tweak the final document before concluding.