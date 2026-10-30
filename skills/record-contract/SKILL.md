---
name: record-contract
description: Use when adding language-neutral contract cases for a route or behaviour and recording the expected output from the original service, including side effects (DB, cache, storage, queues, logs).
---

# Record contract cases

A contract case is a request plus its recorded expectation: status, headers, body, and side effects. Cases are recorded from the **original** service and replayed against the new one on the same sealed stack from the same seed.

## Stack rules

- Run both services only in the sealed local stack (no external network, mocks for every third party), never on the host with real config.
- Config overrides go in the compose file / env file, never through a shell (quotes get stripped).
- One stack per worker (separate compose project + ports) so parallel work never shares state; if the stack is shared, take a lock.

## Writing a case

1. Request: method, URL, headers, body; use templates for tokens/ids that the runner fills in.
2. Expectation from the original: status, headers, body. Normalize only what is truly non-deterministic (timestamps, generated ids, host names) with explicit rules; compare images by format/size/pixel tolerance and compressed/binary files by content, not bytes, where the encoder may differ legitimately.
3. Side effects worth asserting: object storage keys, cache keys/fields/TTL class, queue/pub-sub messages, stub-server journal (outgoing HTTP), DB rows via a read-only query, log lines other systems parse.
4. Setup steps when needed: seed rows (through the seed generator, not hand-written SQL), objects with old timestamps, service restart with an overlay config.
5. Dates in seeds relative to "now" where behaviour depends on age, so cases do not rot.

## Recording

- Record from a clean seed; cases that share identities (auto-increment ids) must keep their recorded order.
- Re-record only from the original, never by hand, and explain every changed expectation in the change description.

## Timing-sensitive cases

Wait for a condition (state reached, message seen) instead of sleeping a fixed time. A case that only passes on a fast machine is a flake waiting to block a release.
