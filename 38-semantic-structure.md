# Semantic HTML and landmarks

**Scoring area:** Accessibility (93/100)

## What graders look for
Landmarks (`header`, `nav`, `main`, `footer`), logical headings, `lang` attribute.

## Where your project stands
Good: `<html lang="en">`, `<aside>`, `<header>`, `<main>`, `<footer>`, a single `<h1>`, `h2`/`h3` below it, `<label>` around the toggle and the voice select.

## Gap
The sidebar is an `<aside>` but its buttons are not inside a `<nav>`, so screen-reader users do not get a navigation landmark. The brand mark is a decorative `<span>`.

## What to do
1. Wrap the sidebar buttons in `<nav aria-label="Workspace">`.
2. Add `aria-hidden="true"` to decorative icon spans (`⌂`, `▤`, `⚙`, `ϟ`).
3. Add a skip link: `<a class="skip" href="#main">Skip to content</a>` and `id="main"` on `<main>`.
