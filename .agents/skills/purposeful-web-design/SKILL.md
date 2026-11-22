---
name: purposeful-web-design
description: Purpose-and-intent review for web UI design and frontend changes. Require every HTML element and CSS declaration to serve an explainable user need.
---

# Purposeful web design

1. State the user's task and what a successful interaction looks like.
2. Account for every HTML element and authored CSS declaration in the affected page or component. Keep a compact ledger: `source | purpose | user intent | verification`. Repeated instances may share a component contract; record exceptions separately. Explain structural wrappers as well as visible content.
3. Remove or revise choices without a defensible purpose. Prefer semantic native HTML. For CSS, justify the exact value and its selector/state; include tokens, shorthands and imported rules. A framework default or attractive appearance alone is insufficient.
4. Before implementation, consult `modern-web-guidance` for the relevant platform patterns. Check the intended behavior with keyboard use, narrow layouts, long content and affected accessibility states. Report actual results and remaining checks.
5. Before implementation, refer to https://www.w3.org/WAI/WCAG22/quickref/ for guidance on accessibility standards and best practices.
6. Apply a deletion test before justifying an element: What concrete information or ability would the user lose if this were removed? If the answer is nothing, remove it.
7. Evaluate each heading, tagline, introductory sentence, and helper message separately. Do not group decorative copy with necessary structure. “App identity,” “visual hierarchy,” and “polish” are insufficient justifications without explaining the specific user problem solved.
8. For each visible message, identify the current user action or decision it supports, why it is needed at this moment, and why it belongs in this location. Providing additional information alone is insufficient.
9. Check whether an existing label, control, or status already communicates the necessary information. Remove redundant explanations.
10. Keep development plans, implementation commentary, and general precautionary advice out of task screens unless explicitly requested or necessary for an informed action. Put contextual help at the point where it becomes relevant.
11. The ledger must record an evaluation, not manufacture a purpose for every existing choice.
12. Rework decisions when the maintainer rejects their purpose or intent. Change the design and its evidence; persuasive wording alone does not resolve rejection.
13. When designing a web page, explicitly state the user's task, the desired outcome, and how each element contributes to achieving that outcome. Ensure that every structural and visual choice has a clear, documented purpose aligned with the user's intent.
14. When evaluating design choices, apply Occam’s Razor: prefer the simplest solution that effectively meets the user's needs. Avoid adding complexity without a clear, justified purpose.
15. Hick’s Law: Limit the number of choices presented to the user at any given time. The more options available, the longer it takes for the user to make a decision. Ensure that each choice has a clear purpose and is necessary for the user's task.