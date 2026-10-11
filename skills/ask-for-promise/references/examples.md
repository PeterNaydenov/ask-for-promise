# ask-for-promise examples

## Contents
- Await a callback API
- Race: first to settle wins
- Timeout with a fallback
- Steps in sequence
- Steps in parallel
- One promise per list item
- Per-item timeout
- Long chain of named steps

All examples assume `import askForPromise from 'ask-for-promise'`.

## Await a callback API

```js
const task = askForPromise()
legacyApi(input, (err, value) => {
  if (err) task.cancel(err)
  else     task.done(value)
})
const result = await task.promise
```

Assumes the callback fires once. For a known number of callbacks, use one promise per list item.

## Race: first to settle wins

```js
const task = askForPromise()
fetchFromCache(key).then(task.done, task.cancel)
fetchFromNetwork(key).then(task.done, task.cancel)
const value = await task.promise
```

The slower source keeps running; its result is ignored.

## Timeout with a fallback

```js
const task = askForPromise().timeout(5000, 'timeout')
slowApi(result => task.done(result))

const result = await task.promise
if (result === 'timeout') {
  // slowApi did not answer within 5 s
}
```

## Steps in sequence

Each step receives the original arguments plus every previous result.

```js
const steps = [
  (userId)              => getUser(userId),
  (userId, user)        => getPosts(user.id),
  (userId, user, posts) => renderPage(user, posts),
]
const [user, posts, html] = await askForPromise.sequence(steps, userId).promise
```

## Steps in parallel

```js
const [a, b, c] = await askForPromise.all([fetchA, fetchB, fetchC], token).promise
```

Each function is called with `token`. Already-running promises can be mixed in: `askForPromise.all([fetchA, cachedPromise])`.

## One promise per list item

```js
import { readFile } from 'node:fs'

const files = ['a.txt', 'b.txt', 'c.txt']
const task = askForPromise(files)

task.each(({ value, done, cancel }, index) => {
  readFile(value, 'utf8', (err, text) => err ? cancel(err) : done(text))
})

const texts = await task.promise   // in the same order as `files`
```

## Per-item timeout

```js
const task = askForPromise(urls)
task.each(({ value, done, timeout }) => {
  timeout(2000, null)              // this item resolves with null after 2 s
  request(value, body => done(body))
})
const bodies = await task.promise  // null for every slow URL
```

## Long chain of named steps

Chain with `task.promise.then(...)`; `onComplete` returns `undefined` and cannot be chained.

```js
const prepareFolders = askForPromise()
const writeFiles     = askForPromise()

makeFolders(folders, () => prepareFolders.done())

prepareFolders.promise
  .then(() => {
    saveFiles(files, () => writeFiles.done())
    return writeFiles.promise
  })
  .then(() => console.log('Done'))
```
