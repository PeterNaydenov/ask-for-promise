## Release History



### 3.2.0 ( 2026-07-19)
- [x] `each` callback now receives the item `index` as a second argument;
- [x] Removed the `state` field from the `each` callback — it was always `'pending'` and never reflected the real promise state;
- [x] Test 'Array of promises (each)' was passing on assertions that never ran; rewritten as `async` and now actually verified;
- [x] Fix: `.timeout()` now also calls `task.done(expMsg)` when the timer fires, so the underlying `task.promise` settles with the fallback value (previously it stayed pending, leaking any in-flight resources and disagreeing with `onComplete`); for list mode each still-pending sub-promise is replaced with the fallback, while sub-promises that already settled keep their real value;
- [x] Fix: dropping a `task` with an active `.timeout()` no longer retains the askObject (and the per-item askObjects in list mode) for the full `ttl`. Wrapped `done`/`cancel` now `clearTimeout` the active handle on settlement, and `_timeout` holds the askObject via a `WeakRef` so the setTimeout callback doesn't pin it. All internal methods that used to capture `askObject` via closure now use `this` (or a WeakRef), since V8's tracing GC does not reclaim cycles where a closure on the object captures the object itself. Verified with `--expose-gc` and `FinalizationRegistry`: askObjects are now collected as soon as the user drops the reference;
- [x] Fix: `.timeout()` no longer ships a no-op `Promise.resolve(main)` call;
- [x] Fix: `askForPromise.sequence` and `askForPromise.all` used to silently swallow rejections from their step functions — a rejected step promise left the returned task pending forever, and a synchronous `throw` inside a step propagated out of the function instead of rejecting the task. Both now forward step failures (rejections, sync throws, and bad-list-entry TypeErrors) to `task.cancel(err)`, so calling code can `await task.promise` uniformly;
- [x] Build: removed unused `@types/node` devDependency;
- [x] Build: added `prepublishOnly` script so `dist/` is always rebuilt before publish;
- [x] New: added `.agents/skills/ask-for-promise/` — a Mavis skill that helps AI agents route a developer's use case to the right API (single mode, `sequence`, `all`, `timeout`, list mode with `.each`) and avoid the known gotchas. Lint clean; verified against a race-3-API-calls eval (with-skill picked single mode, surfaced the `done()`-with-no-value gotcha, and gave a tighter answer than the no-skill baseline);




### 3.1.1 ( 2026-04-21)
- [x] Fix: Types are not visible in npm package;


### 3.1.0 ( 2025-10-23 )
- [x] Typing updates; 
- [ ] Bug: Types are not visible in npm package;



### 3.0.2 ( 2025-10-01)
- [x] Dev dependencies package updates;



### 3.0.0 ( 2024-12-17)
- [x] Method 'each' added;
- [x] Documentation update;
- [x] Improvment of type definitions;
- [x] Method 'onComplete' can receive second argument - reject function;



### 2.0.3 ( 2024-01-31)
- [x] Fix: Folder 'dist' missing in npm package;



### 2.0.1 ( 2024-01-28)
- [x] Package.json: "exports" section was added. Allows you to use package as commonjs or es6 module without additional configuration;
- [ ] Bug: Folder 'dist' missing in npm package;



### 2.0.0 ( 2024-01-06)
- [x] Ask-for-promise becomes a ES6 module;



### 1.5.0 ( 2023-10-27)
- [x] JsDoc types;



### 1.4.0 ( 2023-10-15 )
- [x] AskForPromise.all - execute a list of promise functions in parallel;
- [x] AskForPromise.sequence - execute a list of promise functions in sequence;



### 1.3.0 (2017-07-16)

- [x] Promise with timeout;
- [x] Tests for promise with timeout;
- [x] Code Refactoring;
- [x] Documentation update;



### 1.2.2 (2017-02-04)

- [x] Documentation update;





### 1.2.1 (2016-07-10)

- [x] 'onComplete' function was added;
- [x] Documentation update;
- [x] Test cases for 'onComplete' function;
- [ ] Browser version



### 1.1.2 (2016-06-13)

 - [x] Fix typo in documentation;



### 1.1.1 (2016-06-13)

 - [x] Array as argument;
 - [x] Documentation update;
 - [x] Test case;
 - [ ] Browser version



### 1.0.0 (2016-03-12)

 - [x] Node.js module;
 - [x] Test package;
 - [x] Example file;
 - [ ] Browser version
