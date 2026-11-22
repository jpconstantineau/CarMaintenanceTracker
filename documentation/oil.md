# Oil history and forecasts

Issue: `.scratch/first-usable-version-build/issues/05-oil-history-and-forecasts.md`.

The owner's task is to record oil changes, reported life, level checks and top-ups, then inspect achieved intervals and supported forecasts. Success means preserving the entered facts, showing the evidence behind an estimate and keeping unknown information explicit.

## Contracts

History retains existing oil-change IDs and adds optional maintenance item, action, part and cost details to that same record. Schema 5 adds separate oil-life (nullable 0–100 percentage), oil-level (nullable low/normal/high) and oil-top-up (nullable positive litres) records. Versions 1–4 validate against their original shapes before conversion; existing items, units, date precision, notes, IDs and unknowns are retained. No reset or inference from notes occurs.

Calculations exposes `oilSummary(collection, vehicleId)`. It returns raw oil records, the known last change, completed intervals, median/sample count, forecast and calendar evidence/reasons. UI handlers only format these results. OLS uses recorded observations within the current continuous interval; the estimate is anchored at the latest usable oil-life reading. A partial starting interval never fabricates an earlier service or a 100% reset. Missing records, ambiguous chronology and unexplained increases withhold fits. A recorded current 0% is observed due. Historical fallback needs a known last-change odometer and supported completed intervals. Calendar estimates use the latest two suitable dated vehicle odometers and a positive rate; no present mileage is invented.

Approved seams are History operations, Calculations results, Storage JSON round trips, and complete browser workflows (source spec Testing Decisions). No static typechecker is configured; runtime syntax is checked with `node --check` alongside focused tests.

## Purpose ledger

Extends the existing vehicle/history/maintenance ledgers and reuses their neutral themes, 44px controls, wrapping action rows, focus and validation rules. Consulted modern-web-guidance forms/accessibility and the [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/).

| Source | Purpose and deletion test | User intent | Verification |
| --- | --- | --- | --- |
| Summary Oil heading, status paragraph and details button | Identify the oil-specific result and give access to its evidence without adding full history to the summary. | Decide whether to review oil/change it. | Forecast and observed-zero journey. |
| Oil view heading and Vehicle summary button | Identify selected vehicle/context and provide return navigation; heading receives focus. | Review the right car. | Focus assertion and keyboard journey. |
| Oil details status, conditional evidence/coverage/reason paragraphs | Show the source, limitations, reference reading and why an estimate is unavailable; actual 0% remains the trigger. Each message appears beside the result it qualifies. | Assess the estimate. | Known numeric examples and screenshots. |
| Oil definition list | Pair interval median/count and optional calendar result with their values. | Compare achieved history and forecast. | Module examples and narrow layout. |
| Interval/support lists with dates, readings and units | Expose individual intervals and the exact evidence used. | Review or correct supporting facts. | Numerical tests and history edits. |
| Oil action row and four native buttons | Start a named change, life reading, level check or top-up with fresh date/mileage. | Record what happened. | Blank-input and complete entry workflows. |
| View oil records button and filtered shared history | Reuse record inspection/edit/removal with stable identities. Relevant missing-record annotations remain visible. | Correct/backfill raw oil history. | Edit/recalculation journey. |
| Oil checks and top-ups details/summary in entry | Keep three specialized actions out of the initial six-action list while leaving Change oil directly available. | Choose a concrete check or top-up. | Native disclosure and keyboard entry. |
| Separate labelled percentage, native level select, litres controls and nearby error text | Keep life, level and volume distinct; optional facts stay blank/unknown. Number constraints and public validation reject invalid domains without losing drafts. Select conserves space within multiple-record phone entry. | Enter known facts accurately. | Validation, round trips and browser persistence. |
| Existing item/action/part/cost fields applied to Change oil | Attach details to the same factual change rather than duplicate it. | Enrich existing service history. | Identity and qualifying-baseline tests. |
| Oil section spacing and disclosure target CSS | Reuse 2rem group separation and 1.5rem below return navigation/action groups; give disclosure the project's 44px minimum and 0.75rem clearance. Scoped wrapping protects long dates/notes at enlarged text. | Read/operate on phones. | 320px/200% verification. |

## Verification

The forms/accessibility guides informed explicit-submit validation, labelled native date/number/select controls, programmatic error descriptions and heading focus. The project's 44px target overrides the generic forms guide's 48px advice. All operations are browser-local; a server-form fallback does not apply. No dependency or runtime framework was added.

Final local checks passed: 50 public-module tests, 110 browser tests, JavaScript syntax checks and asset-version validation (`5690864654b3`). One pre-existing phone-WebKit forced-colors emulation test is skipped. Browser tests exercise complete entry, blank independent dates/mileages, invalid percentage/litres, optional unknowns, editing, actual zero, durable reload and JSON round trips. Cached v1/v3/v4 releases upgrade without clearing data; immediately preceding v4 oil changes keep their identity and notes and can acquire item details without duplication. Desktop light and phone-WebKit dark screenshots at 320px/200% text were visually inspected; controls remain readable and the page does not overflow horizontally. Physical phone keyboard/date-picker behavior and real screen-reader announcement quality remain human checks.

Separate code-review axes compared this slice with `80d1272923cc7ff54e1b0a4eaea07768392e3a9c`. Standards found no breaches or meaningful smells. Spec identified one P2: unrelated historical mileage conflicts blocked a clean current oil interval. A red-before-green regression now verifies the independent current 108,000 km forecast and 2025-03-29 calendar while retaining old history warnings. Conflict checks are scoped to the current interval and the calendar's actual support readings. Both reviewers confirmed zero outstanding findings.
