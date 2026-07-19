'use strict'
/*
   askForPromise Description
   ========================
   Returns object with the promise and related helper functions.
   - Created March 12th, 2016;
   - Promise with timeout added July 16th, 2017 (v.1.3.0);
   - askForPromise.all & AskForPromise.sequence added October 15th, 2023(v.1.4.0);
   - jsDocs type definitions added October 27th, 2023(v.1.5.0);
   - Converted to ES6 module January 6th, 2024(v.2.0.0);
   - Massive refactoring of the library. Method 'each' added December 18th, 2024(v.3.0.0);
*/



/**
 * @typedef {Object} EachContext
 * @description Per-item context passed to the `each` callback. Carries the
 *   underlying value plus per-item controls (`done` / `cancel` / `timeout`).
 * @property {any} value - The list item passed to `askForPromise(list)`. In
 *   single-promise mode this is `null`.
 * @property {(value?: any) => void} done - Resolves this single item. In list
 *   mode this settles one sub-promise; in single mode it settles the main
 *   promise. If a per-item or list-level `.timeout()` is active, also
 *   clears the pending timer for this item.
 * @property {(reason?: any) => void} cancel - Rejects this single item. If
 *   a per-item or list-level `.timeout()` is active, also clears the
 *   pending timer for this item.
 * @property {(ttl: number, expMsg: any) => AskObject} timeout - Per-item
 *   timeout helper. In single mode the returned `AskObject` is the same one.
 */



/**
 * @callback EachCallback
 * @description Callback invoked once per list item by `askObject.each()`.
 * @param {EachContext} ctx - Per-item context (value + done / cancel / timeout).
 * @param {number | undefined} index - Position of the item in the input list.
 *   `undefined` when `each` is called on a single-mode `AskObject`
 *   (no list).
 * @param {...any} args - Extra arguments forwarded from `task.each(cbFn, ...args)`.
 */



/**
 * @typedef {Object} AskObject
 * @description Object with a promise and related helper functions. Returned
 *   by `askForPromise()`, `askForPromise(list)`, `askForPromise.sequence(...)`
 *   and `askForPromise.all(...)`.
 * @property {Promise<any>} promise - The underlying promise. In list mode this
 *   is `Promise.all(promises)` and resolves to an array of values in input
 *   order once every sub-promise resolves.
 * @property {AskObject[]|null} promises - `AskObject[]` in list mode, `null`
 *   in single mode. Use `task.promises[i].done(value)` to resolve a single item.
 * @property {(value?: any) => void} done - Resolves the promise (or all
 *   sub-promises with the same value, in list mode). If a `.timeout()` is
 *   active on this `AskObject`, also clears the pending timer so the
 *   underlying resources can be released immediately.
 * @property {(reason?: any) => void} cancel - Rejects the promise (or all
 *   sub-promises with the same reason, in list mode). If a `.timeout()` is
 *   active on this `AskObject`, also clears the pending timer.
 * @property {(cbFn: EachCallback, ...args: any[]) => void} each - Iterates
 *   the items and calls `cbFn({ value, done, cancel, timeout }, index, ...args)`
 *   for each. In single mode the callback is invoked once with `value: null`
 *   and `index: undefined` (the second positional argument is still
 *   present, just `undefined`).
 * @property {(fx: (result: any) => void, rejectFx?: ((error: any) => void) | null) => void} onComplete
 *   Sugar for `promise.then`. Pass a second function as the reject handler.
 * @property {(ttl: number, expMsg: any) => AskObject} timeout - Arms a
 *   `ttl`-millisecond timer. On expiry, the task settles with `expMsg`:
 *   `onComplete` is rewired to return the fallback, AND the underlying
 *   `task.promise` is also settled with `expMsg` (so `await task.promise`
 *   and `task.onComplete(...)` agree). In list mode each still-pending
 *   sub-promise is replaced with `expMsg`, while sub-promises that already
 *   settled keep their real value. Returns the same `AskObject` so the
 *   call can be chained.
 */



/**
 * Creates an `AskObject` with a single promise, or one promise per item in
 * `list` (in which case all sub-promises are bundled into a single
 * `AskObject` whose `promise` is `Promise.all(...)`).
 * @function askForPromise
 * @param {Array<any>} [list] - Optional. List of items; each gets its own
 *   sub-promise. Omit for a single promise.
 * @returns {AskObject} Object with the promise and related helper functions.
 */
function askForPromise ( list ) {
        if ( list ) return _manyPromises ( list )
        else        return _singlePromise ();
 } // askForPromise func.



/**
 * Executes a list of step functions one after the other. Each step is
 * called with the original `...args` plus the result of the previous step
 * appended at the end, so a step's resolved value threads through to the
 * next. The returned `task.promise` resolves to an array of every step's
 * resolved value once the chain completes; if any step rejects (or throws
 * synchronously) the task rejects with that error and the chain stops.
 * @function sequence
 * @memberof askForPromise
 * @param {Array<(...args: any[]) => any>} list - Steps; each is expected to
 *   return a promise (a non-thenable return is accepted via `Promise.resolve`
 *   and treated as a resolved value).
 * @param {...any} args - Arguments passed to the first step. Each step
 *   additionally receives the previous step's resolved value as its last
 *   argument.
 * @returns {AskObject} `AskObject` whose `promise` resolves to the array of
 *   step results (in order), or rejects on the first step failure.
 */
 askForPromise.sequence = function promiseInSequence ( list, ...args ) {
  const
        task = askForPromise ()
      , result = []
      ;

  function* listGen ( n ) {   for ( const el of n ) { yield el }}
  const g = listGen ( list );

  function wait ( n, ...args ) {   // Recursive function for calling function list in sequence
      if ( n.done ) {
               task.done ( result )
               return
          }
      // Defer evaluation so a synchronous throw inside the step becomes a
      // promise rejection (caught below) instead of escaping `sequence()`.
      Promise.resolve ().then ( () => n.value (...args) ).then ( r => {
              result.push ( r )
              wait( g.next(), ...args, r )
          }, err => {
              task.cancel ( err )
          })
      } // wait func.

  try {
      wait ( g.next(), ...args ) // Starting with iteration of list
  } catch ( err ) {
      task.cancel ( err )
  }
  return task
} // promiseInSequence func.



/**
 * Executes a list of step functions in parallel. Each entry in `list` may
 * be either a function (called with `...args`) or an already-running
 * promise / thenable. The returned `task.promise` resolves to an array of
 * results in declaration order once every entry resolves, matching
 * `Promise.all` semantics; if any entry rejects (or a step function
 * throws synchronously) the task rejects with that error.
 * @function all
 * @memberof askForPromise
 * @param {Array<((...args: any[]) => any) | Promise<any>>} list - Steps to
 *   run in parallel; each is either a function or a thenable.
 * @param {...any} args - Arguments passed to each step function. Ignored
 *   for thenable entries.
 * @returns {AskObject} `AskObject` whose `promise` resolves to the array of
 *   step results (in order), or rejects on the first step failure.
 */
askForPromise.all = function promiseAll ( list, ...args ) {
  const
        task = askForPromise ()
      , result = []
      ;
  let r;
  try {
      r = list.map ( (n,i) => {
                            // Defer evaluation so a synchronous throw inside a step function
                            // becomes a promise rejection instead of escaping `all()`.
                            return Promise.resolve ().then ( () =>
                                (typeof n === 'function') ? n(...args) : n
                            ).then (
                                r => result[i] = r,
                                err => { throw err }   // Re-throw so Promise.all surfaces the rejection
                            )
                        })
  } catch ( err ) {
      task.cancel ( err )
      return task
  }
  Promise.all ( r ).then (
      () => task.done(result),
      err => task.cancel(err)
  )
  return task
} // promiseAll func.





/**
 * Creates a single-promise `AskObject`. Internal — use `askForPromise()`.
 * @private
 * @returns {AskObject} `AskObject` with a single underlying promise and the
 *   standard helper functions. The `each` helper, when called, invokes its
 *   callback once with `{ value: null, done, cancel, timeout }` and
 *   `index: undefined` (the second positional argument is present but
 *   `undefined`, matching the list-mode `each` signature).
 */
function _singlePromise () {
  let  done, cancel;
  const x = new Promise ( (resolve, reject ) => {
                                                  done   = resolve
                                                  cancel = reject
                                 })
    // Internal slot for the active timer (if any). Stored on the askObject
    // (not in a closure variable) so that the timer-clearing wrappers in
    // done/cancel, the timer-setting setter in _timeout, and the
    // askObject's own self-references all live on the same object — which
    // means dropping the askObject reference releases the whole cycle.
    const askObject = {
               promise       : x
             , promises      : null
             , _activeTimer  : null
             , each          : () => {}
             , onComplete    : _after(x)
             , timeout       : () => {}
           }

    // Use a WeakRef so the wrapped done/cancel (and the setTimeout callback
    // in _timeout) can settle the task and access _activeTimer without
    // strongly capturing the askObject. Strong capture (e.g. via `const
    // self = this` in a regular function, or via an arrow function) would
    // create a cycle `askObject → askObject.done → askObject` that V8's
    // tracing collector does NOT reclaim, leaving the askObject live until
    // its timer fires. The WeakRef keeps the cycle breakable.
    const askObjectRef = new WeakRef(askObject)

    // Wrap done/cancel so they clear the active timer (if any) before
    // settling the promise. Settling the promise is a no-op if it's already
    // settled, so the wrapped functions are safe to call from any path
    // (askObject.done/cancel, the each callback, or the timer's own callback).
    // These are regular functions — they use the WeakRef to reach the
    // askObject instead of capturing it via closure — so the askObject can
    // be garbage-collected even if these methods are still referenced.
    askObject.done   = function ( value )  { const o = askObjectRef.deref(); if (o !== undefined && o._activeTimer !== null) { clearTimeout(o._activeTimer); o._activeTimer = null } done(value)   }
    askObject.cancel = function ( reason ) { const o = askObjectRef.deref(); if (o !== undefined && o._activeTimer !== null) { clearTimeout(o._activeTimer); o._activeTimer = null } cancel(reason) }

    askObject.timeout = _timeout ( false )
    askObject.each = function (cbFn, ...args) { cbFn({value: null, done: askObject.done, cancel: askObject.cancel, timeout: this.timeout}, ...args) }

    return askObject
   } // _singlePromise func.



/**
 * Creates a list-mode `AskObject` where each item in `list` gets its own
 * sub-promise, all controlled by a single returned `AskObject`. Internal —
 * use `askForPromise(list)`.
 * @private
 * @param {Array<any>} list - List of items; each becomes a separate
 *   sub-promise.
 * @returns {AskObject} `AskObject` whose `promise` is `Promise.all` over
 *   every sub-promise, `promises` is the array of sub-`AskObject`s, and
 *   `done` / `cancel` settle every sub-promise with the same value.
 */
 function _manyPromises ( list ) {
                                    let listOfPromiseObjects = list.map ( el => _singlePromise() )
                                    let listOfPromises   = listOfPromiseObjects.map ( o => o.promise )

                                    listOfPromiseObjects [ 'promises' ] = listOfPromiseObjects
                                    let onComplete = _after ( Promise.all (listOfPromises) )

                                    // The original input list is kept on the askObject so that
                                    // `each` can read the per-item value via `this._list[i]`
                                    // instead of capturing the list via closure. (Capturing
                                    // the list in a closure that's stored on the askObject
                                    // would create an unreachable cycle that V8 doesn't
                                    // collect.)
                                    /** @type {AskObject} */
                                    const askObject = {
                                                  promise       : Promise.all ( listOfPromises )
                                                , promises      : listOfPromiseObjects
                                                , _list         : list
                                                , _activeTimer  : null
                                                , each          : () => {}
                                                , onComplete    : onComplete
                                                , timeout       : () => {}
                                            }
                                    // Wrap list-level done/cancel so they clear the list-level
                                    // timer (if any) before settling every sub-promise. Per-item
                                    // timers are cleared by the per-item wrappers in _singlePromise.
                                    // These are regular functions using `this` (not arrow functions
                                    // capturing askObject), so the askObject can be garbage-
                                    // collected when the user drops the reference.
                                    askObject.done   = function ( response ) {
                                        if (this._activeTimer !== null) { clearTimeout(this._activeTimer); this._activeTimer = null }
                                        this.promises.forEach ( o => o.done( response ) )
                                    }
                                    askObject.cancel = function ( response ) {
                                        if (this._activeTimer !== null) { clearTimeout(this._activeTimer); this._activeTimer = null }
                                        this.promises.forEach ( o => o.cancel( response ) )
                                    }
                                    // `each` uses `this` (no closure capture of the list or
                                    // the array) so dropping the askObject releases everything.
                                    askObject.each = function ( cbFn, ...args ) {
                                        this.promises.forEach ( ( prom, i ) => cbFn ({
                                                                                        value: this._list[i],
                                                                                        done:  prom.done,
                                                                                        cancel: prom.cancel,
                                                                                        timeout: prom.timeout
                                                                                    },
                                                                                    i,
                                                                                    ...args
                                                                                  ))
                                    }

                                    askObject.timeout = _timeout ( true )
                                    return askObject
   } // _manyPromises func.



/**
 * Builds an `onComplete` sugar function for the given promise. Internal.
 * @private
 * @param {Promise<any>} x - The promise to attach handlers to.
 * @returns {(fx: (result: any) => void, rejectFx?: ((error: any) => void) | null) => void}
 *   Function `(fx, rejectFx?) => void`. When `rejectFx` is omitted / `null`,
 *   only the resolve branch is attached (`x.then(fx)`); otherwise both
 *   branches are attached (`x.then(fx, rejectFx)`).
 */
function _after ( x ) {
return function onComplete ( fx, rejectFx=null ) {
                if ( rejectFx === null ) x.then ( res => fx(res) )
                else                     x.then ( res => fx(res) , res => rejectFx(res)  )
}} // _after func.



/**
 * Builds a `timeout(ttl, expMsg)` factory for an `AskObject`. The returned
 * function must be called as a method on the `AskObject`
 * (`askObject.timeout(ttl, expMsg)`); it uses `this` to wire the timer
 * into the receiving askObject. On expiry, the task settles with `expMsg`:
 * `onComplete` is rewired to return the fallback, and the underlying
 * `askObject.promise` is also settled with `expMsg` (so `await promise`
 * and `onComplete(...)` agree).
 * @private
 * @param {boolean} isList - `true` to race the `Promise.all` of every
 *   sub-promise, `false` to race the single promise.
 * @returns {(ttl: number, expMsg: any) => AskObject} A function to be
 *   invoked as a method on the `AskObject`; returns the same `AskObject`
 *   so calls can be chained.
 */
function _timeout ( isList ) {
  /**
   * Arms a TTL timer on the underlying promise(s) and rewires the
   * `AskObject`'s `onComplete` to the race result.
   *
   * Note: this function uses `this` (set by the caller to the askObject)
   * and never captures it in a closure. The setTimeout callback reaches
   * the askObject only via a WeakRef, so dropping the askObject reference
   * allows V8 to collect it even if the timer hasn't fired yet. (V8's
   * tracing GC does NOT reclaim cycles where a closure on the object
   * captures the object — that's why every method on the askObject uses
   * `this` or a WeakRef, never a direct closure capture.)
   *
   * @param {number} ttl - Timeout duration in milliseconds.
   * @param {any} expMsg - Value that resolves the race when the timer
   *   fires before the underlying promise(s).
   * @returns {AskObject} The same `AskObject` (for chaining).
   */
  return function timeout( ttl, expMsg ) {
            const askObjectRef = new WeakRef(this)

            // `main` is the underlying promise(s) the timer races against.
            // In single mode it's the same promise as `this.promise`;
            // in list mode it's a fresh `Promise.all` over every sub-promise.
            let main
            if ( isList ) main = Promise.all( this.promises.map ( o => o.promise ) )
            else          main = this.promise

            let timer
            const timeout = new Promise ( (resolve, reject) => {
                                    timer = setTimeout ( () => {
                                                    // Settle the underlying task with the fallback so
                                                    // `task.promise` returns a regular result and any
                                                    // in-flight resources (hung fetches, pending timers)
                                                    // are released instead of leaking. No-op if the
                                                    // askObject has already been garbage-collected.
                                                    const obj = askObjectRef.deref()
                                                    if (obj !== undefined) obj.done(expMsg)
                                                    resolve(expMsg)
                                                }, ttl)
                                }) // timeout
            // Hand the timer handle to the askObject so the wrapped
            // done/cancel can release the askObject immediately on
            // settlement, instead of waiting for the timer to fire.
            this._activeTimer = timer
            main.then ( () => clearTimeout(timer)   )
            this [ 'onComplete'] = _after ( Promise.race ([main, timeout])   )
            return this
        }
} // _timeout func.



export default askForPromise


