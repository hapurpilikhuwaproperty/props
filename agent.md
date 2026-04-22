# Agent Prompting Guide (Token-Efficient)

- Keep responses concise: prefer bullets; avoid restating the question.
- Cite files with short paths (e.g., `api/src/app.ts`) and avoid inline code dumps unless requested.
- Summaries over excerpts: link to paths instead of pasting large code blocks.
- When presenting commands, group them logically and keep to essentials.
- Prefer references to existing utilities/components rather than repeating their code.
- Avoid speculative text; if uncertain, state so briefly and propose a verification step.
- Default to latest stable tooling already in repo (Next 16, React 19, Tailwind 3.4, Prisma 5.12).
