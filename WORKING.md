# 🔓 FREE

Last held by: Cowork · released 2026-08-30 EDT — shipped mobile/, a
Capacitor scaffold for the Sofratak diner app (wraps the live web
storefront). See docs/PROGRESS.md and mobile/README.md.

---

## What this file is

The lock. **Only one session writes to this repo at a time.** This file says
who holds it. We have collided three times without it — most memorably a seed
CSV that grew from 75 to 164 rows mid-import because two sessions were editing
at once.

## The protocol

**Before you write anything** — first edit, first migration, first script run:

1. **Read this file.** It is the first thing you read in a session, before
   any other file.
2. If the top line says `🔓 FREE`, claim it: replace the whole header block
   with your own stamp (see format below), then start working.
3. If the top line says `🔒 HELD` by someone else, **stop and do not write.**
   Reading, grepping, and reviewing are fine. Tell Zizo the repo is held and
   ask him to hand it over.

**On handoff** — when you finish or Zizo says the repo goes to the other
session, release it by replacing the header block with:

```
# 🔓 FREE

Last held by: <session name> · released 2026-08-26 02:45 EDT
```

## Stamp format

```
# 🔒 HELD — <session name> · <YYYY-MM-DD HH:MM TZ>

Working on: <one line — what you're touching>
```

Session names in use: **Claude Code (terminal session)** · **Cowork**.

## Rules that make it actually work

- **Claiming is a commit.** Stamp, commit, then work — otherwise the other
  session can't see the claim. Same on release.
- **A stale lock is not a free lock.** If the stamp is hours old and looks
  abandoned, ask Zizo before taking it. Don't self-authorize.
- **Data files count.** `data/directory-seed.csv`, migrations, and anything
  under `supabase/` are exactly where collisions hurt most.
- **Long unattended jobs still hold the lock** — a seed import or an OSM run
  is a write, even while it's just sitting there running.
