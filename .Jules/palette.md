## 2023-10-08 - Accessibility for Form Inputs and Icon Buttons
**Learning:** Found several missing `aria-label` attributes on icon-only buttons (like delete, edit, close X buttons) and `<label>` elements missing their `htmlFor` / `id` connection to `<input>` fields in the React form.
**Action:** Always verify that every `label` explicitly connects to its `input` via `htmlFor` matching the `id`, and ensure all buttons with icons and no text are properly documented with `aria-label` for screen reader accessibility.
