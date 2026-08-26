# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `CONTEXT.md` at the repository root
- `CONTEXT-MAP.md` if it exists
- Relevant ADRs under `docs/adr/`

If these files do not exist, proceed silently. The `domain-modeling` skill creates them lazily when terminology or architectural decisions are resolved.

## File structure

This repository uses a single-context layout:

```
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Use the glossary's vocabulary

When naming domain concepts in issues, proposals, tests, or code, use the terminology defined in `CONTEXT.md`. Avoid synonyms that the glossary explicitly rejects.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, surface the conflict explicitly instead of silently overriding the decision.
