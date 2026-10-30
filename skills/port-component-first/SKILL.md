---
name: port-component-first
description: Use when a port needs runtime-compatible building blocks (encoders, template engines, compression, event-loop or scheduling semantics, number/date formatting, validation). Verifies each block against outputs recorded from the original runtime before any route uses it.
---

# Components first

Most late, expensive bugs in a 1:1 port come from building blocks that look equivalent but are not: a library that picks a different encoding, a scheduler that runs callbacks in a different order, a formatter with a different rounding or time zone. Prove each one before porting the code that uses it.

## Steps

1. **Inventory.** List every library/runtime behaviour the original code relies on whose exact output is visible to clients or stored: QR/barcode encoding, image resize, compression level and headers, template engines and their filters, JSON serialization (key order, number format, escaping), date formatting and zones, hashing/crypto, regex flavours, event-loop ordering (timers vs I/O vs immediates), validation error texts.
2. **Record.** For each, write a small generator in the original runtime that feeds realistic and edge inputs and records outputs as JSON (inputs + outputs, no secrets). Cover the input classes that change behaviour (lengths, character sets, empty, huge, unicode).
3. **Replay.** A unit test in the new runtime loads the recording and compares exactly (or within a documented tolerance for images/binary).
4. **Sweep.** Before trusting it, run a one-off random sweep (hundreds of generated inputs) through both runtimes and compare; delete the throwaway test after.
5. **Concurrency semantics.** If the original is single-threaded with an event loop, test ordering explicitly: work after "complete", immediates vs fast I/O completions, timers vs I/O. Write tests that fail on a naive thread-pool implementation.
6. Only then port the routes/features that use the block.

## Rules

- A third-party library is only "equivalent" after step 3 and 4 pass. If it differs, port the original algorithm.
- Keep the recording generator in the repo so it can be re-run when the original changes.
