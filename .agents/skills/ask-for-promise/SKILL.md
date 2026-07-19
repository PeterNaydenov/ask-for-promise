---
name: ask-for-promise
description: |
  Help developers use the `ask-for-promise` library: pick the right API for
  the use case, generate correct code examples, and avoid known gotchas. Use
  when a developer asks how to do X with ask-for-promise, asks for an
  example, or describes an async control-flow need this library can solve
  (decoupled done/cancel, race, sequence, parallel, timeout, N-item list).
  Do NOT use for fixing bugs in the library, refactoring its source, or
  working with other async libraries — those are different tasks.
---

# ask-for-promise helper

## Procedure

1. **Map the developer's use case to an API**:
   - "Convert a callback to awaitable" / "race, first to finish wins" / "pass `done` to a 3rd-party callback" → `askForPromise()` (single mode)
   - "Run N steps one after another and thread their results" → `askForPromise.sequence(list, ...args)`
   - "Run N steps in parallel" → `askForPromise.all(list, ...args)`
   - "Bound a promise with a timeout" → chain `.timeout(ttl, fallback)` on any `AskObject`
   - "Iterate N items, each gets its own promise" → `askForPromise(list)` + `.each(cb, ...args)`
   - "Long async chain without nested `.then`" → declare each step as a named `askForPromise()`, wire with `onComplete` + `return nextTask.promise`
   - "Mixed sync/async work" → single-mode `askForPromise()`; call `task.done()` from the sync branch

2. **Read the source as the contract**:
   - `src/askForPromise.js` — JSDoc on each function is canonical
   - `test/01.general.test.js` — executable examples for each pattern
   - `README.md` — narrative examples and the `AskObject` property table

3. **Generate code that follows the real API shape**:
   - ESM import: `import askForPromise from 'ask-for-promise'` (CJS: `require('ask-for-promise')`)
   - List mode returns ONE `AskObject`: `task.promise` is `Promise.all(...)`, `task.promises` is the array of per-item `AskObject`s
   - `.each` callback signature: `({ value, done, cancel, timeout }, index, ...args)` — in single mode `value` is `null` and `index` is `undefined` (the second positional argument is still present, just `undefined`)
   - In list mode, `task.done(v)` resolves EVERY sub-promise with `v`; use `task.promises[i].done(v)` to resolve individually
   - `task.timeout(ttl, fallback)` arms a timer; on expiry both `onComplete` and `task.promise` settle with `fallback` (they're consistent — use whichever fits the call site). In list mode each still-pending sub-promise is replaced with `fallback`.
   - `onComplete(fx, rejectFx?)` — pass a second function for the reject branch; with one arg it only listens to resolve

4. **Avoid known gotchas in the answer** (don't surface them all — only the one relevant to the current example):
   - `sequence` / `all` reject the task on any step failure (rejection OR sync throw). Don't suggest the old "swallowed silently" behavior — it was a bug.
   - `sequence` appends each step's resolved value to the next step's args. If the consumer doesn't want that, point them to `all` instead.
   - In list mode, `task.done()` with no value resolves with `undefined`. Mention this if it's surprising.
   - `each` on a single-mode `AskObject` calls the callback once with `value: null` and `index: undefined` (the second positional argument is still present) — it is NOT a no-op (despite the old JSDoc that used to call it one).

5. **If the use case doesn't fit** any pattern, say so. ask-for-promise is a thin decoupled-promise helper, not a general async framework. For retry / abort / mid-flight cancel, recommend a different library.

## Output contract

- One focused code snippet, ESM by default (CJS if asked)
- One line of context explaining why this API fits the use case
- A pointer to the relevant source/test section if the developer wants to dig deeper
- Surface at most one relevant gotcha proactively, only if it applies to the example

## Failure handling

- Use case genuinely ambiguous → ask ONE clarifying question, then pick the closest match
- Developer reports a bug or unexpected behavior → do NOT try to fix from this skill; route to the project maintainer (or run the test suite) instead
- Developer asks for a feature the library doesn't have → say so plainly, don't invent an API

## Examples

**"I have 3 fetch calls. Run them in parallel and await the results."**

```js
import askForPromise from 'ask-for-promise'

const task = askForPromise.all([fetchA, fetchB, fetchC], token)
const [a, b, c] = await task.promise
```

If any step rejects, `task.promise` rejects with the first error. See `askForPromise.all` in `src/askForPromise.js` and the "All promises in parallel" test in `test/01.general.test.js`.

**"I have a Node-style callback API `(err, value) => ...`. I want to await it."**

```js
import askForPromise from 'ask-for-promise'

const task = askForPromise()
legacyApi(input, (err, value) => {
  if (err) task.cancel(err)
  else     task.done(value)
})
const result = await task.promise
```

Assumes the callback fires exactly once. For repeated callbacks (events, streams), use list mode with `.each` instead.
