---
name: purposeful-web-design
description: Purpose-and-intent review for web UI design and frontend changes. Require every HTML element and CSS declaration to serve an explainable user need.
---

# Purposeful web design

1. State the user's task and what a successful interaction looks like.
2. Account for every HTML element and authored CSS declaration in the affected page or component. Keep a compact ledger: `source | purpose | user intent | verification`. Repeated instances may share a component contract; record exceptions separately. Explain structural wrappers as well as visible content.
3. Remove or revise choices without a defensible purpose. Prefer semantic native HTML. For CSS, justify the exact value and its selector/state; include tokens, shorthands and imported rules. A framework default or attractive appearance alone is insufficient.
4. Before implementation, consult `modern-web-guidance` for the relevant platform patterns. Check the intended behavior with keyboard use, narrow layouts, long content and affected accessibility states. Report actual results and remaining checks.
5. Rework decisions when the maintainer rejects their purpose or intent. Change the design and its evidence; persuasive wording alone does not resolve rejection.
