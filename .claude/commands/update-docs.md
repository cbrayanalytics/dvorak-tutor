Run all three test suites and update CLAUDE.md and .claude/progress.md to reflect the current state of the project.

Steps:
1. Run `node tests/words.test.js`, `node tests/index.test.js`, `node tests/app.test.js` — capture the pass counts.
2. Update the test counts in CLAUDE.md (Running the App section) if they changed.
3. Review `git log --oneline -10` for recent changes not yet reflected in CLAUDE.md:
   - New settings → add to Settings table
   - New exported functions → add to Pure functions or Key DOM functions table
   - New CSS patterns → add to CSS Gotchas
   - New features → add a bullet to the Completed Features list in .claude/progress.md
4. Update the "Last updated" date in .claude/progress.md to today.
5. Commit any changes as: `docs: update CLAUDE.md and progress.md`
