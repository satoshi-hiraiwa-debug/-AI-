# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Whenever you make any content or implementation update, create the current shareable artifact and place it in `shared-build/` before reporting completion. For this Vite prototype, run `pnpm run build` so the repo-root `shared-build/` directory contains the latest built app. Do not finish with source-only changes when the change affects the user-visible artifact.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.
