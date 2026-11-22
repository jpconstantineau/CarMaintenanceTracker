# Vehicle UI purpose and verification ledger

The [history ledger](history.md) extends this foundation ledger for the dated-entry/history screens, summary actions, and their added styles.

Task: create, identify, edit and reopen a vehicle without losing or mixing its details. Success is the correct saved vehicle, an honest description of missing history, and editable work retained after a failed save. The user also explicitly requested a persistent header control for System / Light / Dark.

Scope: every element in `docs/index.html`, generated vehicle buttons in `docs/interface.js`, and every authored declaration in `docs/styles.css`. Repeated fields and rows share contracts below. Exact palette, typography, spacing and corner values come from [DESIGN.md](../DESIGN.md). There are no imported styles or downloaded fonts.

## Deletion review

The former ledger incorrectly grouped a tagline with the app heading and justified two footer paragraphs by their informational content. Those justifications did not identify a current decision that required the copy. This review changes the interface, not just the rationale.

| Removed source | Deletion decision | User intent | Verification |
| --- | --- | --- | --- |
| Header tagline | “Your vehicles, one history at a time.” supplied no information or action beyond the app and screen headings | Start the vehicle task directly | Absent in markup and browser assertion |
| Local-storage precaution footer | “Vehicle details stay in this browser on this device. Clearing site data removes them.” was a general precaution, repeated the scope already in save status, and offered no relevant action here | Know whether this save succeeded | Removed; transaction-specific status and recovery remain |
| Coming-later footer | Roadmap did not support a currently available action | Use available features | Removed; future scope remains in README |
| Empty-list explanation | Repeated the empty save status and Add vehicle action | Begin setup | Removed; creation journey passes |
| Editor introduction | Repeated required-field labels and explicit submit action | Enter and save details | Removed; keyboard creation passes |
| Outer “Vehicle details” legend | Repeated the editor heading | Identify the form | Removed; fieldset uses that heading as its accessible name |
| Missing identifying-details sentence | Explained absence of optional values without supporting a decision | Recognize a vehicle from facts that exist | Description is hidden when empty |
| Section card treatment | The current task is already identified by its heading and only one screen is active | Follow a single task | Frames, shadows and decorative surfaces absent |

## Elements and messages

Each message below is evaluated at the moment and location where it appears; messages do not become justified merely by belonging to a necessary wrapper.

| Source | Purpose | User intent | Verification |
| --- | --- | --- | --- |
| doctype, html/lang, head, charset, viewport | Standards mode, English semantics, UTF-8, device width without disabling zoom | Read on phone/desktop | Semantic inspection and narrow-layout checks |
| title | Identify this app in browser tabs and history | Return to the right app | Markup inspection |
| color-scheme meta and inline script | Declare supported native schemes early and restore a valid saved override before styles/modules load; blocked storage falls back to System | Reopen in the chosen theme | Module-load interception and blocked-storage tests |
| stylesheet link, module script | Load presentation and working vehicle behavior | Open saved vehicles | All browser journeys |
| body, header, main | Document and separate application controls from the main task landmark | Locate task content | Semantic inspection |
| h1 | Name the application; vehicle names alone would not identify the tool | Recognize the open application | Screenshot inspection |
| .theme-control div | Group the theme label, select and failure status; wrap them together on phones | Change viewing preference | 320px and enlarged-text tests |
| Theme label, select, System/Light/Dark options | Explicitly requested names with native keyboard and touch operation | Follow the device or pin a theme | System/override, keyboard, persistence and cross-tab tests |
| #theme-status p role=status | Normally empty/hidden; only reports that a chosen preference could not be remembered, next to its control | Understand the result of changing theme | Blocked preference storage test |
| .save-state div | Keep the save result, failure and retry adjacent above each screen | Determine durability and recover | Save-failure/retry journeys |
| #save-status p role=status | Opening, empty, unsaved, saving, saved or failed state at the point of work; “on this device” describes the completed operation without claiming remote sync | Decide whether work still needs saving | Transaction abort, success, draft and reopening assertions |
| #storage-error p role=alert | Explain an actual load/save failure, retain-work consequence and retry at the moment they matter | Recover the current work | Abort, unavailable storage, stale-tab and version tests |
| #retry button | Offer a retry after a failed read or selection save, hidden otherwise | Resume the blocked task | Unavailable-storage retry test |
| Three section elements and aria-labelledby | Only the active named selection, summary or editor region is exposed | Work in one screen at a time | Creation/edit/switch journeys |
| Your vehicles heading | Identify the list from which a vehicle can be opened | Select a vehicle | Multi-vehicle journey |
| Vehicle title heading | Show which vehicle owns the displayed details | Avoid editing the wrong record | Selection/reopening assertions |
| Add vehicle / Edit vehicle details heading | Identify whether the form creates a record or changes an existing one | Choose the correct operation | Form journey assertions |
| Heading tabindex=-1 | Move focus on navigation without adding heading tab stops | Follow the newly opened screen | Keyboard assertions |
| #vehicle-list ul, generated li/button | Semantic list of named full-row actions; names inserted as text; aria-current identifies the selected vehicle | Open the intended record | Multiple vehicles, literal HTML and selection-marker assertions |
| Add vehicle, All vehicles, Edit vehicle details buttons | Working creation, selection and editing navigation | Reach the desired task | Complete browser journeys |
| #vehicle-description p | Show available year/make/model to disambiguate identity; hidden when absent | Recognize the selected vehicle | Edit/reopen assertions |
| dl, dt/dd pairs | Associate units, latest mileage, history and notes with their actual values | Review recorded facts | Summary assertions |
| Unknown-mileage and no-history messages | State that missing evidence is unknown, rather than zero or a completed service history; placed with the affected value | Interpret an older vehicle accurately | Missing-evidence tests |
| No-notes value | Distinguish a genuinely empty saved field from omitted rendering | Review the notes field | Multi-vehicle isolation test |
| form/novalidate/aria-labelledby | Native Enter/submit with shared domain validation and linked inline errors | Submit once, correct mistakes | Keyboard and validation tests |
| #editor-fields fieldset/aria-labelledby | Disable the complete entry group during its transaction, named by the existing heading | Avoid duplicate submissions | Abort/retry and save lifecycle checks |
| .field div wrappers | Keep each label, input and error together | Scan one field at a time | Phone screenshots |
| Required/optional labels, for/id | Name each field and distinguish minimum setup from information that can be omitted | Enter only known details | Accessible-name locators and minimal-vehicle test |
| Name input, maxlength, name-hint p | Constrain the identifying name to 100 characters; example clarifies that a nickname is allowed, with the limit next to entry | Choose a recognizable label distinct from make/model | Blank, long-name and literal-text tests |
| .units fieldset/legend | Give the two radio values one required question | Record the units actually displayed by the car | Check and arrow-key tests |
| .choices div and two inner divs | Keep each radio with its clickable label while allowing choices to wrap | Select units on a narrow phone | Layout and label-area checks |
| Native radios and their labels | Expose both mutually exclusive units without a custom widget | Select km or mi | Keyboard/check assertions |
| Make/model/year inputs and constraints | Optional identity facts; numeric keyboard hint for year without treating it as an incrementable quantity | Leave unknown facts blank | Optional values and invalid-year tests |
| Notes textarea, rows=4, maxlength=5000 | Multi-line facts, about four initial lines, with native resizing | Read and edit longer context | Newline, long-content and literal HTML tests |
| Field-error paragraphs and aria-invalid/describedby | Reveal and link a correction only after submission; clear it on input | Correct the relevant field | Invalid-field focus, color and ARIA assertions |
| .actions div, submit and Cancel buttons | Group the two form outcomes with explicit button types | Save or discard current input | Creation/edit/cancel tests |
| #form-error p role=alert | Explain collection-level rejection that cannot be assigned to a field | Correct a failed submission without losing input | Domain rejection tests and handler inspection |
| noscript/p | Explain why an otherwise inactive task cannot run, only when scripting is disabled | Understand the blocked task | Markup inspection |

## CSS declarations and exact values

Token values below are the accepted design choices, not a claim that WCAG mandates a particular font size or radius. No arbitrary card styling is retained.

| Source | Purpose of declarations/values | User intent | Verification |
| --- | --- | --- | --- |
| :root color variables | Light primary #202020, secondary #595959, neutral #F5F5F5, surface #FFFFFF, hover #E6E6E6, error #B3261E, error surface #FFF0EE implement the specified neutral palette and actionable-error treatment | Read routine information without alarm colors | Palette assertions and contrast calculation |
| Dark media query and explicit dark selector | Replace the same roles with #EDEDED, #B8B8B8, #121212, #1E1E1E, #303030, #FFB4AB, #36201E; media query excludes an explicit Light choice | Follow System or the saved override | Both modes, live OS changes and reload tests |
| :root color-scheme and meta selectors | Base light dark enables native themes; explicit light/dark declarations override the base because the meta hint alone cannot override CSS | Keep native UI consistent with the chosen page | Bootstrap and theme tests |
| :root spacing/shape tokens | xs=.25rem binds labels/errors; sm=.5rem separates related controls; control=.75rem supplies internal clearance; md=1rem separates fields/page edge; lg=1.5rem and xl=2rem separate larger groups; corner=4px and target=44px match the agreed shape and touch minima | Read grouping and operate controls by touch | Target and phone-layout assertions |
| :root font/color/background/accent | sans-serif uses default installed fonts; 100% honors root preferences; line-height1.5 separates lines; primary/neutral pair supplies page contrast; primary accent keeps native radios neutral | Read and enter facts in either theme | Computed styles, resize tests and screenshots |
| *; body | border-box counts padding inside available width; margin0 removes uncontrolled outside spacing | Fit the phone viewport | No-overflow assertions |
| header, main | max-inline-size48rem limits desktop scan width; auto inline margins align content; md padding leaves phone edge clearance | Follow one readable column | Desktop/phone screenshots |
| header | flex, wrap, centered alignment, space-between and md gap keep title and theme beside each other when they fit and separated when they wrap | Access theme without overlapping identity | 320px/200% checks |
| h1; h2; h1,h2 | h1 1.5rem/1.25 with zero margin; h2 1.25rem/1.3 with 0/lg block margins; weight600 distinguishes headings; anywhere wrapping contains long vehicle names | Identify the current task or vehicle | Long-name and enlarged-text tests |
| .theme-control; its label | flex/wrap/center and sm gap align label/select; weight600 matches other labels | Locate the requested preference | Phone screenshot and target check |
| #theme-status | 100% flex-basis puts a rare failure under its control; margin0 avoids added blank spacing; secondary remains neutral because the current theme still works | Know the preference applies only to this page | Blocked-storage test |
| Empty theme/global error messages | display:none removes unused paragraphs and their spacing | See only relevant messages | Empty status and screenshots |
| .save-state; #save-status | xl bottom separation keeps persistence distinct from the task; secondary color and 0/sm margins keep routine status quiet and adjacent to recovery | Check whether saving succeeded | Save-state tests and screenshots |
| #storage-error,#form-error | error text/error-surface background identify an actual task-level failure; control padding, corner radius and anywhere wrapping keep its explanation legible | Recover the current operation | Storage failure tests and palette checks |
| fieldset | border0/padding0/margin0 remove nested native frames; min-inline-size0 permits narrow reflow | Retain semantic grouping without cards | 320px/200% checks |
| legend | weight600, padding0, sm bottom margin name the units immediately above their choices | Associate choices with their question | Phone screenshots |
| .field,.units; .field>label | md bottom margin separates fields; block labels with weight600 and xs bottom margin remain close to their control | Scan the form | Phone screenshots |
| .hint | secondary color with xs/sm block margins keeps the name guidance readable and adjacent to its field | Choose the label before typing | Screenshot inspection |
| input,textarea,select,button | font:inherit carries browser-relative size and sans-serif into native controls | Read controls at the chosen text size | Computed style and 200% checks |
| Text inputs,textarea,select | min-block/min-inline44px provide touch minima; max-inline100% prevents overflow; control padding separates text from a 1px secondary border; corner4px, surface/primary colors distinguish editable areas | Enter readable values | Target, contrast and reflow checks |
| Text inputs,textarea; textarea | inline-size100% uses the entry column; resize:vertical permits expansion without horizontal page overflow | Edit long notes | Long-content journey |
| .choices; .choices>div | flex/wrap with sm/lg gap separates options and wrapped lines; inner flex/center aligns each radio with its label | Choose units on a phone | Narrow screenshots and keyboard tests |
| Radio inputs | 1.25rem inline/block size and 0/sm/0/0 margin retain native shape with readable separation from the label | Recognize checked state | Native checked-state assertions and screenshots |
| .choices label | flex/center aligns text; min-block/min-inline44px supplies a tappable associated label; pointer cursor indicates that label is interactive | Select by label as well as radio | Measured target and label-check tests |
| button | min44px both axes, max-inline100%, control padding, 1px secondary border, corner4px, primary fill/surface text, weight600, pointer cursor and anywhere wrapping create readable operable actions | Submit or navigate reliably | Contrast, keyboard and target checks |
| button.secondary | surface fill/primary text retains a boundary with less emphasis | Cancel or return to selection | Screenshots and navigation tests |
| button:hover,:active | hover fill/primary text give neutral feedback with stable geometry | Recognize pointer activation | CSS inspection and screenshot after activation |
| button:disabled | wait cursor supplements native disabled semantics during an active transaction, without reducing text contrast | Wait for saving to finish | Failure/retry journeys |
| :focus-visible | 3px primary outline offset3px stays distinct from control borders without shifting layout | Navigate by keyboard | Focus style assertions in both themes and forced colors |
| Invalid input/textarea; .field-error | error border supplements linked error text; error text has xs/0 block margins and anywhere wrapping | Find and correct invalid input | Error/focus/ARIA assertions |
| .actions | flex/wrap and control gap keep save/cancel apart and allow enlarged labels to wrap | Choose the intended form outcome | Reflow and cancellation tests |
| #all-vehicles | lg bottom margin separates return navigation from the selected vehicle heading | Recognize the selected record | Summary screenshot |
| #vehicle-list | list-style:none and padding0 remove bullets redundant with full-row actions; 0/md block margins separate the list from Add; empty list display:none removes unused spacing | Select existing or create new | Empty and multiple-vehicle journeys |
| #vehicle-list button | inline100%, text-align:start, weight400, transparent background/primary text retain a plain list; border0 resets all edges, then a 1px secondary bottom rule separates rows and 4px transparent start edge reserves selection space; radius0 keeps rows square | Scan and tap vehicle names | Long-name/reflow checks |
| List hover/active/current | hover background provides neutral feedback; current primary start border adds shape and aria-current supplies semantics | Recognize the active vehicle without color alone | Selection-marker assertions |
| dt; dd | weight600 distinguishes terms; dd margin0/0/md aligns values and separates pairs; anywhere wrapping contains unbroken text; pre-wrap retains notes' newlines; tabular-nums enables aligned readings when the font supports them | Read recorded values faithfully | Long notes, newlines and literal HTML assertions |
| Forced-colors override | Selector has equal specificity to explicit-theme selectors; CanvasText/Canvas replace all used tokens, retaining system contrast without forced-color-adjust:none | Use OS high contrast settings | Chromium forced-colors checks |

The warning tokens in DESIGN.md are not emitted because this slice has no warning component. No animation, fixed-height text, decorative shadow/gradient, custom dropdown, remote font, card grid or imported CSS is required.

## Verification for this redesign

- Node public-module tests: 12 passed.
- Desktop Chromium, phone Chromium and phone WebKit: 44 passed; one WebKit forced-colors check explicitly skipped because that emulation is Chromium-only.
- Existing data journeys still pass: browser restart, selected vehicle reopening, prior v1 fixture, stable IDs, literal input, transaction abort/retry, stale tabs and unsupported schema preservation.
- Added checks cover live System changes, explicit overrides, reload/browser restart, early initialization before modules, cross-tab synchronization, blocked preference storage, selected vehicle/draft/focus retention, and no vehicle-collection writes when changing theme.
- Both themes checked at 320px, standalone targets measured at least 44×44 CSS pixels, keyboard focus and linked validation verified, and 200% root text size combined with WCAG text-spacing overrides retained reflow in form, summary and list.
- Visually inspected WebKit phone light/dark validation screenshots and Chromium desktop summary with a 100-character name and long literal notes. No clipping or overlapping controls appeared; heading wrapping and field spacing retained the intended hierarchy.
- DESIGN.md's 28 specified foreground/background pairs were previously validated at >=4.5:1, with no specification lint errors or warnings. All 18 used text/background and necessary-edge pairs were recalculated: lowest light contrast 5.61:1, lowest dark contrast 6.65:1. These include hover states and inline/task-level errors; token checks alone are not a complete accessibility audit.
- Physical-device keyboards and screen-reader announcements remain human checks; emulation does not establish those outcomes.

Sources consulted before implementation: [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) and modern-web-guidance `dark-mode`, `dark-mode-toggle`, `color`. The user's explicit three-choice header requirement takes precedence over the guide's preference for placing theme overrides in a separate settings surface.
