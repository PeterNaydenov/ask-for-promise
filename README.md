<img src="Ask-for-promise.png" width="100%" alt="Ask for Promise" title="Ask for Promise" align="center" />

# Ask for Promise

![version](https://img.shields.io/github/package-json/v/peterNaydenov/ask-for-promise)
![license](https://img.shields.io/github/license/peterNaydenov/ask-for-promise)
![npm](https://img.shields.io/npm/dt/ask-for-promise)
![GitHub issues](https://img.shields.io/github/issues/peterNaydenov/ask-for-promise)
![GitHub top language](https://img.shields.io/github/languages/top/peterNaydenov/ask-for-promise)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/peterNaydenov/ask-for-promise)
![npm bundle size](https://img.shields.io/bundlephobia/min/ask-for-promise)

> **Decouple a `Promise` from its `resolve` / `reject` and let any code complete it.**

A standard `Promise` is born inside an executor function, and only that function can resolve or reject it. `ask-for-promise` flips that around — it returns a `Promise` together with its resolve and reject handles as plain object properties, so you can call them from anywhere: a callback, an event handler, a timer, another promise, or a sync function.

## Why

The moment an async task finishes is rarely the same place where the task was started. `ask-for-promise` is a small DX layer for those cases:

- **Race conditions** — share one `done` between N parallel callbacks to emulate `Promise.race`.
- **Long chains** — declare each step as a named `askForPromise()` and wire them up without nesting `.then`.
- **Mixed sync / async** — a function that's sometimes sync can still call `task.done()`.
- **Legacy callback APIs** — pass `task.done` straight to a Node-style callback.
- **Timeouts** — race any promise against a TTL with `.timeout(ttl, fallback)`.

## Features

- Decoupled `done` / `cancel` — call them from anywhere
- `onComplete` sugar for `promise.then`, with an optional reject handler
- `.timeout(ttl, fallback)` — race against a timer
- `askForPromise(list)` — one `AskObject` for N promises, with `.each` for iteration
- `askForPromise.sequence(list, ...args)` — run steps in order, threading results as args
- `askForPromise.all(list, ...args)` — run steps in parallel
- TypeScript types included
- Zero runtime dependencies

## Installation

```sh
npm install ask-for-promise
```

```js
// ES modules
import askForPromise from 'ask-for-promise'

// CommonJS
const askForPromise = require('ask-for-promise')
```

## Quick start

```js
import askForPromise from 'ask-for-promise'

const task = askForPromise()

// Call `done` from anywhere — even a callback API:
setTimeout(() => task.done('done'), 1000)

// `onComplete` is sugar for `task.promise.then`
task.onComplete((result) => {
  console.log(result) // → 'done'
})
```

`task.promise` is a real `Promise`. `task.done` is its `resolve`. `task.cancel` is its `reject`. Anything you can do with a normal `Promise` works here too.

## API

### `askForPromise()` → `AskObject`

Creates a single promise and returns its `AskObject`.

```js
const task = askForPromise()
```

### `askForPromise(list)` → `AskObject`

Creates one promise per item in `list` and returns a single `AskObject` that controls them all. `task.promise` resolves to an array of values in input order when every sub-promise resolves.

```js
const task = askForPromise(['a', 'b', 'c'])
```

### `askForPromise.sequence(list, ...args)` → `AskObject`

Runs each function in `list` one after the other. The result of each function is appended to `args` and passed to the next — useful for piping values through async steps.

```js
const steps = [loadUser, loadPosts, renderPage]
askForPromise.sequence(steps, userId).onComplete(([user, posts, html]) => {
  // ...
})
```

### `askForPromise.all(list, ...args)` → `AskObject`

Runs each entry in `list` in parallel. Entries can be functions (called with `...args`) or already-running promises; the result array is in declaration order.

```js
askForPromise.all([fetchA, fetchB, fetchC], token).onComplete(([a, b, c]) => {
  // ...
})
```

### `AskObject`

| Property | Description |
| --- | --- |
| `promise` | The underlying `Promise`. In list mode this is `Promise.all(promises)`. |
| `promises` | `AskObject[]` in list mode, `null` in single mode. Use `task.promises[i].done(value)` to resolve a single item. |
| `done(value?)` | Resolves the promise(s) with `value`. In list mode, resolves every sub-promise with the same value. |
| `cancel(reason?)` | Rejects the promise(s) with `reason`. In list mode, rejects every sub-promise with the same reason. |
| `onComplete(resolveFn, rejectFn?)` | Sugar for `promise.then`. Pass a second function as the reject handler. |
| `each(cbFn, ...args)` | Calls `cbFn({ value, done, cancel, timeout }, ...args)` per item. |
| `timeout(ttl, fallback)` | Replaces `onComplete` with a race against a `ttl`ms timer; `fallback` resolves on expiry. Returns the same `AskObject` so you can keep chaining. |

## Examples

### Simple promise

```js
const task = askForPromise()

function asyncWork() {
  // ... do something
  task.done('task complete')
}

task.onComplete((result) => {
  console.log(result) // → 'task complete'
})
```

### Promise.race, the manual way

A single shared `done` produces a race — the first callback to call it wins, the rest are no-ops.

```js
const task = askForPromise()

slowAsync((err, r) => task.done('slow'))
fastAsync((err, r) => task.done('fast'))

task.onComplete((winner) => {
  console.log(winner) // → 'fast'
})
```

### Long chain without nesting

Declare each step as a named variable, then wire them up:

```js
const prepareFolders  = askForPromise()
const writeFiles      = askForPromise()
const updateInterface = askForPromise()

myFS.makeFolders(folders, () => prepareFolders.done())

prepareFolders
  .onComplete(() => {
    myFS.writeFiles(files, () => writeFiles.done())
    return writeFiles.promise
  })
  .then(() => {
    updateInterface()          // sync part of the work
    updateInterface.done()
    return updateInterface.promise
  })
  .then(() => {
    console.log('DONE')
  })
```

### Promise with timeout

`timeout` returns the same `AskObject`, so you can keep chaining.

```js
const task = askForPromise().timeout(2000, 'expire')

setTimeout(() => task.done('success'), 5000)

task.onComplete((result) => {
  if (result === 'expire') console.log('timed out')
  else                     console.log(result)
})
```

In list mode, the timer applies to the whole group:

```js
const task = askForPromise([job1, job2, job3]).timeout(1000, 'expire')
```

### List of promises with `.each`

`task.each(cb)` walks the list and hands you a per-item `{ value, done, cancel, timeout }`:

```js
const files = ['info.txt', 'general.txt', 'about.txt']
const task  = askForPromise(files)

task.each(({ value, done, cancel }) => {
  fs.writeFile(value, 'dummy text', (err) => {
    if (err) cancel(err)
    else      done()
  })
})

task.onComplete(() => console.log('DONE'))
```

`task.promise` here is equivalent to `Promise.all(task.promises.map(p => p.promise))`. To resolve a single item rather than all of them, call `task.promises[i].done(value)`.

## TypeScript

Type definitions are bundled — no extra install.

```ts
import askForPromise, { AskObject } from 'ask-for-promise'

const task: AskObject = askForPromise()
```

## License

MIT — see [LICENSE](./LICENSE).

## Credits

Created by [Peter Naydenov](https://github.com/PeterNaydenov).

## Changelog

[Changelog.md](./Changelog.md)
