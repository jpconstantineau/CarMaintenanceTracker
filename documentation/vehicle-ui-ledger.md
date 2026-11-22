# Vehicle UI purpose and verification ledger

Task: name a vehicle, choose its odometer units, optionally identify it further, then reopen or switch to it without mixing or losing details. Success is a usable summary with honest missing evidence and a committed local-save status.

Scope: all of `docs/index.html`, generated vehicle-list entries in `docs/interface.js`, and all declarations in `docs/styles.css`. Repeated fields/list entries share the contracts below. No imported styles, decorative assets or third-party UI rules.

## Elements

| Source | Purpose | User intent | Verification |
| --- | --- | --- | --- |
| doctype, html lang, head, charset, viewport, color-scheme, title, stylesheet link | Standards rendering, English semantics, UTF-8, device-sized viewport, predictable native contrast, recognizable tab and styles | Read and enter details on phone/desktop | Both engines render; 320px overflow check |
| body, header, h1 and tagline p | Page landmark and stable app identity | Know which app is open | Screenshot inspection |
| main | Main task landmark | Find the vehicle task | Semantic HTML inspection |
| .save-state div | Keep status, failure explanation and retry adjacent above every screen | Understand whether work is durable | Failure, retry and success tests |
| #save-status p role=status | Polite state announcements | Distinguish draft, saving and committed data | Successful/aborted transaction tests; no false saved message |
| #storage-error p role=alert | Announce failures with retained-work guidance | Recover without losing input | Abort, unavailable storage, newer version, stale tab tests |
| #retry button | Explicit retry after failed read or selection save; hidden otherwise | Resume use when storage is available | Blocked-storage retry test |
| Three section elements, headings and aria-labelledby | Named selection, summary and editor regions; hidden removes inactive controls from navigation | Work in one screen at a time | Journey and keyboard tests |
| Heading tabindex=-1 | Programmatic navigation focus without extra tab stops | Know which view opened | Keyboard and focus assertions |
| #empty-list p | Explain minimum setup and permit missing history | Start an older vehicle confidently | Empty-state and creation tests |
| #vehicle-list ul, generated li/button | Semantic collection of separate selectable vehicles; names inserted as text | Select the intended vehicle | Multi-vehicle and untrusted-text tests |
| Add vehicle, All vehicles and Edit vehicle details buttons | Actual working navigation actions | Create, switch, correct | Complete browser journeys |
| #vehicle-description p | Optional year/make/model or explicit absence | Recognize the selected vehicle | Edit/reopen assertions |
| dl with four dt/dd pairs | Associate units, mileage, history and notes with values | Review identity and unknown history | Summary/reopen tests; screenshot inspection |
| Editor introduction p | Required fields and when details become durable | Know what to enter and when it saves | Visible copy inspection |
| form, novalidate, aria-labelledby | Native submit semantics with consistent inline errors from shared domain validation; native validity inspected before domain operation | Submit by button or Enter without navigation | Keyboard, blank-name and year validation tests |
| #editor-fields fieldset/legend | Group identifying fields and disable during the active transaction | Avoid duplicate submissions while saving | Save lifecycle inspection and retry tests |
| .field div wrappers | Keep each label, hint, input and error together | Scan one field at a time | Phone screenshot |
| Six labels with for/id | Visible required/optional names linked to controls | Enter only known identifying information | Accessible-name locators for every field |
| Name input and #name-hint p | Recognizable name, 100-character limit, persistent example | Distinguish vehicles | Whitespace validation and long-name tests |
| .units fieldset/legend, .choices div, two inner div, native radios and following labels | Expose both choices, keep control and tap label together, allow wrapping | Record the actual displayed units | Check/arrow-key tests; phone screenshot |
| Make/model inputs, year text input with numeric inputmode and pattern | Optional identifying values; year is not an odometer quantity or spinner | Leave unknowns empty | Optional fields and malformed-year tests |
| Notes textarea rows=4 and maxlength=5000 | Multi-line facts with room for roughly four initial lines and resizing | Retain historical context | Long notes, linebreak and literal HTML tests |
| Field-error p elements, aria-invalid/describedby updates | Explanatory text only after submit, linked to invalid field; clear during editing | Correct the first problem without premature warnings | Invalid-field focus/ARIA assertions |
| .actions div, submit button, Cancel button | Wrap submission and cancellation with explicit button types | Record or discard the current form | Create/edit/cancel tests |
| #form-error p role=alert | Announce collection-level validation errors without erasing fields | Understand errors not attributable to one field | Code inspection; domain rejection tests |
| noscript p | Explain why the task cannot run with scripting off | Understand an otherwise inactive page | Markup inspection (no server-side persistence fallback exists) |
| footer with two p | Describe device-local durability and identify later unavailable features as text | Avoid mistaking local save for Gist sync or placeholder actions | Screenshot inspection |
| module script | Start modules after parsing | Open saved vehicles without a build framework | Browser journeys |

## CSS declarations and exact values

| Source | Purpose of declarations/values | User intent | Verification |
| --- | --- | --- | --- |
| :root | `color-scheme:light` keeps native controls in the reviewed palette; `system-ui,sans-serif` uses device fonts; `#172a36` text on `#f3f6f7` canvas gives readable contrast; `line-height:1.5` separates text lines | Read body text comfortably | Screenshots; palette contrast calculation |
| *; body | `border-box` includes padding in field widths; `margin:0` removes the outer browser inset | Fit controls inside the viewport | 320/390px no-overflow checks |
| header/main/footer | `max-inline-size:48rem` limits desktop scanning width; `margin-inline:auto` aligns landmarks; `padding:1rem` leaves phone edge clearance | Follow a consistent readable column | Desktop/phone screenshots |
| h1; h1,h2 | `clamp(1.5rem,5vw,2rem)` fits the app name on phones while capping desktop size; `line-height:1.2` groups multi-line headings; `overflow-wrap:anywhere` contains long vehicle names | Recognize app and selected vehicle | 100-character name test |
| header p,.hint,footer | `#415766` gives secondary text contrast without competing with primary task text | Read instructions | Screenshots and contrast calculation |
| section | White surface separates the active task; `1px solid #a8b6be` identifies its extent; `0.5rem` corner radius separates it from square page edges; `1.25rem` padding gives inputs clearance from the frame | Identify the current workspace | Screenshot inspection |
| section > :first-child | `margin-block-start:0` avoids doubling default heading margin with frame padding | See a consistent task start | Screenshot inspection |
| .save-state; #save-status | `1rem` bottom margin separates persistence from navigation; weight `600` makes the durable state scannable | Check whether changes saved | Failure/success screenshots and text assertions |
| #storage-error,#form-error,.field-error | `#9d2424` gives errors contrast; `overflow-wrap:anywhere` handles long storage error strings | Read recovery instructions | Failure tests, palette calculation |
| Empty global errors | `display:none` on `:empty` avoids blank error paragraphs while keeping the live containers in markup | See only relevant instructions | Initial and saved screenshots |
| fieldset | `border:0;padding:0;margin:0` avoids nested browser frames; `min-inline-size:0` overrides intrinsic minimum sizing to keep fields within phones | Use semantic grouping without overflow | Narrow layout test |
| legend | `font-weight:600;padding:0;margin-block-end:0.5rem` names groups closely above their fields | Distinguish units and vehicle details | Phone screenshot |
| #editor-fields > legend | `margin-block-end:1rem` separates the overall group heading from the first label | Scan form hierarchy | Phone screenshot |
| .field,.units | `margin-block-end:1.25rem` separates adjacent fields more than labels from inputs | Associate the correct label and field | Phone screenshot |
| .field > label | `display:block` puts labels above inputs; weight `600` differentiates labels; bottom gap `0.25rem` keeps association tight | Scan single-column entry | Phone screenshot |
| .hint | `margin-block:0.25rem 0.5rem` leaves label proximity while separating helper text from the input | Read name example before entry | Phone screenshot |
| input,textarea,button | `font:inherit; font-size:max(1rem,1em)` keeps native controls at least 16px at default root size and follows enlarged text | Read inputs without phone focus zoom | Rendered control sizing |
| Text inputs,textarea | `inline-size:100%` uses available width; `min-block-size:3rem` supplies 48px controls; `padding:0.65rem` leaves internal reading room; `1px solid #627683` creates a distinct control edge; `0.25rem` radius distinguishes fields from buttons; white background with `#172a36` text makes native content legible | Enter details reliably by touch | Phone screenshot, no-overflow tests |
| textarea | `resize:vertical` permits more writing space without horizontal overflow | Read/edit long notes | Four-line long-note screenshot; native resizing retained |
| .choices | Flex with wrap keeps the two unit choices inline when possible; `gap:0.5rem 1.5rem` separates wrapped lines and adjacent targets | Choose units easily on narrow screens | 320/390px tests |
| .choices > div | Flex with centered items aligns each radio and its label | See which label belongs to which option | Phone screenshot |
| radio inputs | `1.25rem` width/height makes the native circle clear; `margin:0 0.5rem 0 0` separates its following label; `accent-color:#125b70` makes native selection legible | Recognize selected units | Arrow-key/check assertions |
| .choices label | Flex/center, `min-block-size:3rem`, pointer cursor give a 48px high clickable label while keeping the radio native | Select by touch or pointer | Phone screenshot and label-driven check tests |
| button | `min-block-size:3rem` gives a 48px target; `0.65rem 1rem` padding prevents text touching edges; `1px solid #125b70` delineates the target; `0.3rem` corners identify controls; `#125b70` fill/white text distinguish primary action; pointer cursor shows interactivity; anywhere wrapping contains long vehicle names | Act confidently without clipping labels | Palette calculation, keyboard and long-name tests |
| button.secondary | White background and `#125b70` text reduce emphasis on Cancel/All vehicles while retaining contrast | Prefer recording over leaving the form | Screenshots |
| button:hover | Brightness `0.9` provides subtle pointer feedback while retaining contrast | Recognize the hovered action | CSS inspection |
| button:disabled | Wait cursor and opacity `0.65` communicate a transaction in progress; disabled state supplies semantics | Avoid duplicate submissions | Transaction tests and code inspection |
| :focus-visible | `3px solid #8b4200` outline with `3px` offset gives a distinct focus perimeter outside controls | Navigate by keyboard | Keyboard assertions; focus visible in phone screenshot |
| Invalid input/textarea | `border-color:#9d2424` reinforces the explicit linked error text; uses managed ARIA state only after submit | Correct errors without premature warnings | Empty-form and correction test |
| .field-error | `margin-block:0.25rem 0` binds the error to its field, leaving group separation to .field | Identify the field to fix | Validation assertions |
| .actions | Flex, wrap, `gap:0.75rem` separates primary/cancel targets and wraps without reordering | Use buttons on narrow phones | 320px check |
| #vehicle-list | No bullets/padding prevents duplicate visual markers for full-row buttons; grid and `0.75rem` gap separate vehicle targets | Choose a vehicle without tapping the next one | Multi-vehicle test |
| #vehicle-list button | Full inline width makes the row tappable; start alignment supports scanning; white surface and `#125b70` text distinguish selection from creating a new vehicle | Select an existing vehicle | Screenshot/layout and switching tests |
| dt; dd | Weight `600` identifies terms; `margin:0 0 1rem` keeps values aligned with space between pairs; anywhere wrapping contains long notes; `white-space:pre-wrap` preserves recorded newlines | Review notes faithfully | Literal-text, newline and long-content tests |

No animation, sticky positioning, custom dropdown, remote font, or imported stylesheet is needed for this task. Error styling uses submit-triggered ARIA state rather than raw `:invalid`; native constraints remain the first check, and the same domain validation protects persistence.

## Recorded verification

- Node interface tests: 12 passed.
- Desktop Chromium, phone Chromium and phone WebKit: 30 browser checks passed, including full-browser shutdown/restart with persistent profiles in both engines.
- Actual screenshots inspected: phone WebKit editor and desktop Chromium summary with 100-character name, long unbroken notes and literal HTML. Clear focus, legible controls and text, no clipping or overlap. The long textarea remains scrollable and resizable.
- Automated keyboard journey uses Tab, Enter and arrow keys, checks focus and ARIA errors, then creates/edits/cancels. Overflow checked at 1280/390 and 320 CSS pixels. Real IndexedDB abort, successful retry, stale-tab rejection and incompatible stored format tested.
- Calculated palette contrast: primary text/canvas 13.61:1, secondary text/canvas 6.96:1, error/white 7.74:1, primary button white text 7.62:1, input edge/white 4.73:1, focus/white 7.30:1.
- Published-site verification: all 12 live browser journeys passed against implementation commit `a936278b51e7eb41b41fe3dcce66859100cabcfa`; Pages deployment and GitHub CI both succeeded. The live runtime assets matched the commit. The ticket retains deployment links.
- Remaining human checks: physical mobile keyboard behavior and screen-reader announcements on actual assistive technology. Emulation and semantic assertions do not claim those tests were performed.
