## 2023-10-27 - [Add ARIA labels to icon-only buttons]
**Learning:** Found several icon-only buttons (Logout, Play, Edit, Delete, Close, Remove access) without ARIA labels in `App.tsx`, meaning screen readers would just announce them as "button" instead of describing their action.
**Action:** Always verify all icon-only buttons have descriptive `aria-label` attributes.
