# Dated vehicle history

Ticket: `.scratch/first-usable-version-build/issues/02-record-and-correct-history.md`.

The task is to enter the facts known about a vehicle, inspect their chronology, correct a single record, and reopen the saved history. Success preserves each observation's identity, units, unknowns and date precision; it does not imply that an inspection was a service.

## Public interfaces and persistence

The specification's approved testing seams remain History, Calculations, Storage and browser workflows. No runtime dependency or new module is introduced.

- History adds `saveSession(collection, defaults, entries)` returning `{collection, recordIds}`, `listRecords`, `getRecord`, `updateRecord`, and `removeRecord`. All operations validate and return detached data without mutating inputs. A failed session is atomic. Defaults are copied into individual records; subsequent corrections never update siblings. Kind and stable identity cannot be replaced during a correction. The owning vehicle can be corrected, including after a failed save, without changing record identity or reading units.
- Events share `id`, `vehicleId`, `kind`, `date`, `odometer`, `odometerUnit`, `notes`, `createdAt`, and `updatedAt`. `odometer` records require a number; general `observation` records allow null mileage and empty notes. Zero is valid evidence. Record units survive later changes to the vehicle's display units. Notes are literal text.
- Gaps share identity/edit metadata and retain `date`, `endDate`, `historyType`, and notes. The affected type is all, odometer, observation, maintenance, oil, tires, or fueling. Gaps never contribute mileage or imply a service. Start/end precision bounds may overlap but cannot be wholly reversed. Deletion keeps `{id, kind, deletedAt}` forever.
- Calculations adds `mileageEvidence(collection, vehicleId)` returning original and normalized readings with date bounds, relevant odometer gaps, and issues with supporting record IDs. Future event validators can add kinds sharing these fields without adding another mileage path. `vehicleHistory` returns a newest-first display order plus chronology issues. `summarizeVehicle` uses this evidence for mileage and its source date; earlier maintenance stays unknown.
- Disjoint dates establish order. Overlapping approximate dates with different consistent readings can be ordered by mileage; overlapping dates without sufficient mileage remain explicitly ambiguous. Repeated equal readings (including converted equivalents) are not conflicts, but do not resolve overlapping approximate dates: their shared mileage remains known while an uncertain latest date lists its candidate dates. Different exact-day readings have no within-day ordering evidence and require review; a later lower reading is also flagged. Original records remain editable. Mileage summary is conservatively withheld while mileage conflicts remain. Display ordering of unresolved ties uses stable IDs, never edit time, and is not claimed as exact chronology. Repeated warning text appears once per affected record even when multiple conflicting pairs support it.
- Dates are ISO calendar strings of length 4, 7, or 10, validated for years 0001–9999 and leap years. Integer YYYYMMDD bounds represent uncertainty only and are not persisted as observed days. No `Date` parsing, timezone conversion, date arithmetic, or Temporal dependency is needed for event dates. ISO instants remain appropriate for edit metadata. Native Temporal's partial-date guide was consulted; its polyfill was unnecessary for this bounded calendar-string representation.
- Portable schema 2 adds these record kinds. `deserialize` validates schema 1 under its original constraints before cloning and changing only `schemaVersion`. Vehicle values, collection/vehicle IDs and existing tombstones remain identical. Schema 2 validates fully; unsupported versions/kinds/extra fields are refused. Loading does not rewrite the old snapshot; the next successful save commits schema 2. IndexedDB stays at database version 1 with the original store/key/revision checks. No reset or destructive migration occurs.

The public v1 fixture test and the browser test seed the preceding release's exact persisted JSON and verify compatibility. Module tests cover session atomicity, precise and approximate dates, explicit unknown versus zero, unit conversion, scoped gaps, conflicting and equal readings, backfill, correction, deletion, and serialization. Browser tests use real IndexedDB and abort a transaction after its write request to prove success waits for commit.

## Element and message purpose ledger

This extends the [vehicle ledger](vehicle-ui-ledger.md) for every new/changed element in `index.html` and generated history controls in `interface.js`. Existing form/control/status tokens and declarations retain their documented purpose. Wrappers are included below; there are no imported styles.

| Source | Purpose and deletion decision | User intent | Verification |
| --- | --- | --- | --- |
| Summary `.actions`, Record history, View history, secondary Edit vehicle details | Group the now-available actions; entry is primary, inspection and identifying-detail changes remain accessible | Start recording or inspect the evidence behind mileage | Phone/desktop journeys |
| Summary mileage/history values | Show supported reading, original date precision and count; unknown/conflicting state points to View history | Decide whether mileage is usable | Public calculation examples and UI assertions |
| History section, labelled h2, Vehicle summary button | One active task landmark and a named return route; focus moves to heading after navigation/save | Identify whose history is open | Focus and selected-vehicle tests |
| Record history button in history | Add a backfill while reviewing records | Continue recording without returning to summary | Backfill journey |
| Empty history message | Visible only with no records, distinguishes loaded empty history from a missing list | Decide to add a first entry | Conditional render inspection |
| Ordered list, numbered li, h3 kind/date, mileage or gap span paragraph | Mixed facts have differing fields, so a single-column semantic list preserves reading order across phones; numbers identify the adjacent edit/remove actions | Inspect facts at their retained precision | Screenshots and chronology tests |
| Notes paragraph | Only appears when supplied; preformatted line breaks preserve user meaning, textContent prevents execution | Read the observation | Literal markup and long-text checks |
| Review paragraphs | Only attached to affected records, with a reason and instruction to review readings/dates; stable ties are not presented as certain order | Identify and correct inconsistent or ambiguous evidence | Contradiction and ambiguity tests |
| Edit/Remove numbered buttons and action wrapper | Distinguish records when action names are read out of context | Correct one record without changing siblings | Independent correction/removal journey |
| Native removal confirmation | Names the kind and date before irreversible removal from the visible history; Cancel leaves it intact | Prevent accidental removal | Browser confirm acceptance; tombstone tests |
| History editor section, heading, named form, outer fieldset/vehicle legend | Name the task and owning vehicle; disable the group during persistence to prevent overlapping writes | Record in the right vehicle and wait for commit | Transaction failure/retry and vehicle isolation |
| Defaults fieldset/legend, date and odometer field wrappers/labels/inputs | Explicitly apply to newly added records only; odometer label includes units; no mileage/date is inferred from prior records | Avoid repeated typing without changing existing drafts | Keyboard and multi-record defaults tests |
| Date format helper above defaults input | Explains the accepted precision before typing; linked with aria-describedby | Avoid inventing a day for old history | Partial-date and invalid-calendar tests |
| Record fieldset/legend, wrappers, visible labels and native controls | Group each separate observation or gap; fields follow DOM/tab order | Override defaults independently | Keyboard and sibling isolation tests |
| Vehicle select and unit select/options | Preserve explicit ownership and original reading units per record; compact native selects limit height in repeated records | Enter distinct vehicles/units without reinterpretation | Cross-vehicle and mixed-unit tests |
| Date/start/end inputs and per-field format hints | Format remains available when editing a single saved record, where defaults are hidden; required with max length 10 | Keep exact, month-only, or year-only facts | Validation focus, leap-year and span tests |
| Odometer input, optional/required label | Decimal keyboard, nonnegative native constraint, blank remains unknown for an observation; odometer-only record explicitly requires a value | Preserve incomplete history or record a reading | Unknown/zero, invalid and required checks |
| Affected-history select/options | Scope a known missing span without inventing domain-specific events | Mark only what history is missing | Gap serialization and browser rendering |
| Resizable notes textarea | Retains long prose without a separate dialog | Describe the observation or gap | Long literal text and narrow layout |
| Hidden per-field error paragraph | Created empty; linked and shown only on failed submit; focus moves to the failing field and input clears feedback | Correct the failed field without premature errors | aria-invalid and focus assertions |
| Draft-discard button | Removes an unsaved row; focus returns to Add observation | Undo an accidental draft addition | Handler and collection atomicity review |
| Add observation/odometer/gap buttons and wrapper | Name the supported kinds, creating distinct drafts; hidden during single-record editing | Build a session without forcing every record to share facts | Browser visibility regression |
| Submit/Cancel wrapper and buttons | Commit the session or leave entry; single-record edit uses Save record; failed save uses Retry saving history | Finish editing and distinguish retry from success | Save failure and retry journey |
| Form-level alert | Only for errors without an affected control, e.g. no draft records; programmatically focusable | Learn how to complete submission | Handler inspection |
| Unsaved/Saving/Saved/Not saved status | Reuses the existing status region at the point of submission; beforeunload protects dirty/pending work | Know whether history is durable | Real transaction abort test |

Deletion review: no introductory prose, roadmap, extra card wrapper, per-row edit timestamps, empty notes message, or separate session-save page was added. Each would duplicate existing controls or distract from recording/inspection. Date hints repeat only where necessary because single-record edits hide defaults. Warning text is next to its correction action, not a global banner.

## CSS declaration ledger

Exact values use DESIGN.md. No additional color tokens, type scale, imports or decorative effects were added.

| Selector/declarations | Purpose and exact-value rationale | User intent | Verification |
| --- | --- | --- | --- |
| `[hidden] { display: none !important }` | Preserve the HTML hidden state even when `.actions` supplies flex display; priority prevents active layout rules from exposing inactive controls | Edit only the chosen record | Hidden-session-controls regression |
| `.record-editor` 1px secondary block-start border, lg block padding | One neutral rule separates independent drafts; 1.5rem gives each group enough clearance without a card | Avoid entering a value into the wrong record | 320px screenshot |
| `.history-submit` lg block-start margin | Separate session completion from adding another draft | Find the finishing action | Narrow/editor screenshot |
| `#history-summary, #history-add` lg block-end margin | Separate navigation and recording actions from the heading/history | Follow reading order | History screenshot |
| `#history-list` lg inline-start padding | 1.5rem reserves space for list numbers while conserving phone width | Identify numbered records | 320px no-overflow check |
| `#history-list > li` md block padding and 1px secondary block-end border | 1rem separates records; neutral line identifies the end of one record's actions | Associate controls with records | Phone/desktop screenshots |
| `#history-list h3` 1rem size, 600 weight, 0/sm block margins, anywhere wrap | Body-size label emphasis keeps record titles below the screen heading; 0.5rem keeps data close; long date/kind text wraps | Scan history without oversized repeated headings | Desktop/phone inspection |
| `#history-list p` anywhere wrap and tabular numerals | Prevent long literal notes from overflowing and make readings easier to scan | Read long observations and numbers | Long text and 200% text checks |
| `.record-notes` pre-wrap | Preserve supplied line breaks while allowing wrapping | Read recorded prose faithfully | Literal text journey |
| `.review-note` 4px secondary inline border, control inline padding | Non-color marker identifies a review condition; 0.75rem clearance keeps its text separate | Find affected records and adjacent correction actions | Conflict UI assertions |
| `#history-error` error foreground/surface, control padding, 4px radius, anywhere wrap; empty state display none | Same established error tokens as vehicle validation; no empty error panel | Correct failed submission | Validation and screenshots |
| `select[aria-invalid=true]` error border | Extend existing input/textarea error treatment to history selects | Identify a failed selection consistently | Semantic/style inspection |

## Verification

Consulted the [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) and modern-web-guidance forms/validation guides before implementation. Applied visible associated labels, semantic grouping, delayed validation, linked field errors, focus transfer, native keyboard controls, and resizable notes. Reused the project's 44px minimum targets rather than the guide's generic 48px recommendation. The location-agnostic-date guide informed the decision to avoid timestamp parsing; no Temporal API or polyfill was introduced.

History journeys pass on desktop Chromium, phone Chromium, and phone WebKit, including 320px reflow, long untrusted text, retained draft during theme changes, keyboard entry, 200% text, unknown mileage, gaps, corrections/deletions, independent vehicles and transaction-abort recovery. Inspected desktop light history and phone WebKit dark 320px editor screenshots; text/controls wrap without page overflow and group/focus boundaries remain visible. Physical-device keyboards and real screen-reader announcement quality remain human checks; emulation does not claim them.
