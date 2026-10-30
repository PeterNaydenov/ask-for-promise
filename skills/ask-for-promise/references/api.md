# ask-for-promise API reference

## Contents
- Entry points
- Task object (`AskObject`)
- List task (`AskListObject`)
- `each` callback
- `sequence` and `all`
- TypeScript types

## Entry points

| Call | Returns |
| --- | --- |
| `askForPromise()` | single task (`AskObject`) |
| `askForPromise(list)` | list task (`AskListObject`): one sub-task per item |
| `askForPromise.sequence(steps, ...args)` | single task resolving to `[r1, r2, ...]` |
| `askForPromise.all(steps, ...args)` | single task resolving to `[r1, r2, ...]` |

`askForPromise(null)` and `askForPromise(undefined)` return a single task.

## Task object (`AskObject`)

| Member | Behavior |
| --- | --- |
| `promise` | The underlying promise. |
| `promises` | `null` for a single task. |
| `done(value?)` | Resolves `promise`. Clears an active timeout. |
| `cancel(reason?)` | Rejects `promise`. Clears an active timeout. |
| `onComplete(onResolve, onReject?)` | Same as `promise.then(onResolve, onReject)` but returns `undefined`. With one argument, only the resolve branch is attached. |
| `timeout(ttl, fallback?)` | After `ttl` ms, if still pending, resolves the task with `fallback`. Returns the same task; calling `timeout` again replaces the previous timer. |
| `each(cb, ...args)` | Calls `cb({ value: null, done, cancel, timeout }, undefined, ...args)` once. |

Single-task `done` and `cancel` work when passed as bare callbacks, for example `fetchA().then(task.done, task.cancel)`.

## List task (`AskListObject`)

Same members, with these differences:

| Member | Behavior |
| --- | --- |
| `promise` | `Promise.all` over every item. Resolves to the item values in input order; rejects on the first item rejection. |
| `promises` | Array of per-item single tasks. `task.promises[i].done(v)` settles item `i`. |
| `done(value?)` / `cancel(reason?)` | Settles **every** pending item with the same value. Must be called as `task.done(...)`; passing `task.done` unbound throws. |
| `timeout(ttl, fallback?)` | On expiry, every still-pending item resolves with `fallback`; settled items keep their values. Both `promise` and `onComplete` receive the results array. Calling `timeout` again replaces the previous timer. |
| `each(cb, ...args)` | Calls `cb({ value, done, cancel, timeout }, index, ...args)` for every item. |

An empty list (`askForPromise([])`) resolves immediately with `[]`.

## `each` callback

```
cb(ctx, index, ...args)
```

- `ctx.value`: the list item (`null` for a single task)
- `ctx.done(value?)` / `ctx.cancel(reason?)`: settle this item only; safe to pass as bare callbacks
- `ctx.timeout(ttl, fallback?)`: arm a timeout for this item only; returns the item's task
- `index`: item position (`undefined` for a single task)
- `...args`: the extra arguments given to `task.each(cb, ...args)`

## `sequence` and `all`

`askForPromise.sequence(steps, ...args)`

- `steps`: array of functions. Each may return a promise or a plain value.
- Runs one step at a time. Step `n` receives `(...args, r1, ..., r(n-1))`.
- Resolves with the array of all results. Rejects on the first rejection or synchronous throw; later steps do not run.

`askForPromise.all(steps, ...args)`

- `steps`: array of functions (called with `...args`) or already-running promises.
- Starts everything at once. Resolves with results in input order. Rejects on the first failure.

## TypeScript types

Types ship with the package for both `import` and `require`.

```ts
import askForPromise, {
  type AskObject,        // single task
  type AskListObject,    // list task: promises is AskObject[], each index is number
  type EachContext,      // { value, done, cancel, timeout }
  type EachCallback,     // (ctx, index: number | undefined, ...args) => void
  type EachListCallback, // (ctx, index: number, ...args) => void
  type StepFunction,     // (...args: any[]) => any
} from 'ask-for-promise'
```

CommonJS: `import askForPromise = require('ask-for-promise')`, then `askForPromise.AskObject` and so on.

Values are typed as `any`; annotate the awaited result when a precise type is needed:

```ts
const user: User = await task.promise
```
