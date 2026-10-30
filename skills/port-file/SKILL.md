---
name: port-file
description: Use when porting one source file or route group 1:1 to its mirrored file in the new runtime, gated by its contract cases.
---

# Port one file

## Rules

- **Mirror structure.** One target file per source file, same folder, same base name in the target's casing; same class and method names and order; comments carried over. No extra layers, interfaces or wrappers.
- **Original wins.** Reproduce behaviour exactly, including bugs, quirks and security issues. Record each in an audit document instead of fixing it.
- **Shared compatibility code** (the original runtime's library semantics) lives in one compat folder; never re-implement it inline.
- Data files the original reads (SQL, templates, scripts) are copied byte-identical.

## Steps

1. Read the source file and its callers. List its externally visible effects: responses, DB writes, cache keys/TTLs, queue messages, files, logs other systems parse.
2. Find or write its contract cases (see `record-contract`). Record them from the original first.
3. Port the file. Use the compat helpers for anything whose output must match.
4. Run the file's unit tests and its contract cases against the new build.
5. If a case differs: the new build is wrong. Never edit a recorded expectation by hand.
6. Update the port map (status, case count) and the audit document (any quirk found).

## Done means

- Every contract case for the file passes on the new build.
- Side-by-side diff reads method for method.
- Anything not verified is listed as **not checked**.
