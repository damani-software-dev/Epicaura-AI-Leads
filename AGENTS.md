<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Frontend-only prototype: all data lives in `src/lib/store.ts` (useSyncExternalStore + localStorage), seeded from `src/data/`. Why: brief forbids backend/AI/Google integrations; keeps a single source of truth across pages.
- Selectors passed to `useApp` must return stable references (no `.filter`/`.map` inside); derive with `useMemo`. Why: new arrays cause infinite re-render loops.
- Lead scores are stored as 0–1 evidence per criterion; points/tiers are always computed from current weights via `src/lib/scoring.ts`. Why: weight changes on ICP page must re-score everywhere.
