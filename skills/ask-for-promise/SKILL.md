---
name: ask-for-promise
description: Writes correct JavaScript and TypeScript code with the ask-for-promise library — decoupled promises settled from outside via done/cancel, promise timeouts with a fallback value, async steps run in sequence or in parallel, and one promise per list item. Use when code imports ask-for-promise, or when a developer asks how to await a callback API, race async tasks, add a timeout to a promise, or chain async steps with this library. Not for changing the library's own source code.
license: MIT
metadata:
  author: Peter Naydenov
  package: ask-for-promise
---

# ask-for-promise

`askForPromise()` returns a **task**: an object holding a `promise` plus the `done` (resolve) and `cancel` (reject) functions, so code outside the promise constructor can settle it.

```js
import askForPromise from 'ask-for-promise'        // CommonJS: const askForPromise = require('ask-for-promise')
```

## Pick the API

| Use case | API |
| --- | --- |
| Await a callback API, settle a promise from elsewhere, race several sources (first to settle wins) | `askForPromise()` |
| Bound any task with a timeout | `task.timeout(ttl, fallback)` |
| Run steps one after another, each receiving the previous result | `askForPromise.sequence(steps, ...args)` |
| Run steps in parallel, collect results in order | `askForPromise.all(steps, ...args)` |
| A known number of items, each with its own promise | `askForPromise(list)` + `task.each(cb)` |
| Long chain of named steps without nesting | one `askForPromise()` per step, chained with `task.promise.then(...)` |

Ready-to-adapt code for each row: [references/examples.md](references/examples.md).
Full API, callback signatures and TypeScript types: [references/api.md](references/api.md).

## Rules that prevent wrong code

1. **`onComplete` returns `undefined`.** It ends a chain. To keep chaining, use `task.promise.then(...)` and return the next task's `promise`.
2. **List-mode `done`/`cancel` need their object.** Call `task.done(v)`; never pass `task.done` of a list task as a bare callback (it throws). Single-mode `done`/`cancel` and the ones handed to `each` callbacks are safe to pass around.
3. **List-mode `task.done(v)` settles every item with the same `v`.** To settle one item, use `task.promises[i].done(v)` or the `done` given to the `each` callback.
4. **A timeout resolves, it does not reject.** In single mode both `task.promise` and `onComplete` resolve with `fallback`; compare the result with the fallback to detect it. In list mode both receive the results array, with the fallback for still-pending items. A new timeout replaces the previous timer.
5. **`sequence` appends each step's result to the arguments of the next step.** Step 1 gets `(...args)`, step 2 gets `(...args, r1)`, step 3 gets `(...args, r1, r2)`. When steps are independent, use `all`.
6. **`sequence` and `all` reject on the first failure**, whether a step rejects or throws synchronously. `task.promise` then rejects with that error.
7. **Settling is final.** After the first `done`/`cancel`, later calls are ignored. `cancel` rejects the promise but does not stop the underlying work; this library has no abort, retry or streaming. For those needs, say the library does not fit.

## Writing the answer

- Give one focused snippet, ESM unless the developer uses CommonJS or asks for it.
- Add one sentence on why this API fits the use case.
- Mention at most one rule from the list above, and only if the snippet depends on it.
- If the request is ambiguous, ask one clarifying question, then use the closest match from the table.
- Never invent API. If a feature is missing, say so.

When the package is installed, `node_modules/ask-for-promise/types/index.d.ts` is the authoritative contract.
