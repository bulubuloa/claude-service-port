---
name: review-port
description: Use when reviewing a port change side by side with its original source against the porting rules.
---

# Review a port change

For each changed target file, open the original next to it and check:

1. **Structure** — same file, class and method names (target casing), same order, comments carried over; no new layers.
2. **Behaviour** — every branch, default, error text and status code matches; quirks reproduced, not fixed; anything intentionally different is listed in the audit document with a reason.
3. **Types and serialization** — numbers, dates (UTC, precision), nulls vs missing keys, key order, escaping, as the original emits them; DB parameter types explicit and equal to the original's.
4. **Side effects** — cache keys/TTLs/locks, queue subjects/groups, storage paths, log wording parsed elsewhere: identical.
5. **Concurrency** — work that ran on a single event loop still runs in the original order; nothing moved to a thread pool that writes shared state after "done".
6. **Tests** — contract cases exist for the change and were recorded from the original; no expectation edited by hand; unit tests for compat helpers.
7. **Not checked** — the PR lists what was not verified.

Report findings with file:line, the original's line, and the concrete input that shows the difference.
