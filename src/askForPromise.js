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
 * Per-item context passed to the `each` callback. Carries the
 * underlying value plus per-item controls (`done` / `cancel` / `timeout`).
 * @typedef {Object} EachContext
 * @property {any} value - The list item passed to `askForPromise(list)`. In
 *   single-promise mode this is `null`.
 * @property {(value?: any) => void} done - Resolves this single item. In list
 *   mode this settles one sub-promise; in single mode it settles the main
 *   promise. If a per-item or list-level `.timeout()` is active, also
 *   clears the pending timer for this item.
 * @property {(reason?: any) => void} cancel - Rejects this single item. If
 *   a per-item or list-level `.timeout()` is active, also clears the
 *   pending timer for this item.
 * @property {(ttl: number, expMsg?: any) => AskObject} timeout - Per-item
 *   timeout helper. Returns the item's `AskObject` (in single mode, the
 *   task itself).
 */



/**
 * Callback invoked by `askObject.each()`.
 * @callback EachCallback
 * @param {EachContext} ctx - Per-item context (value + done / cancel / timeout).
 * @param {number | undefined} index - Position of the item in the input list.
 *   `undefined` when `each` is called on a single-mode `AskObject`
 *   (no list).
 * @param {...any} args - Extra arguments forwarded from `task.each(cbFn, ...args)`.
 * @returns {void}
 */



/**
 * Callback invoked once per list item by `askListObject.each()`.
 * @callback EachListCallback
 * @param {EachContext} ctx - Per-item context (value + done / cancel / timeout).
 * @param {number} index - Position of the item in the input list.
 * @param {...any} args - Extra arguments forwarded from `task.each(cbFn, ...args)`.
 * @returns {void}
 */



/**
 * A step for `askForPromise.sequence` / `askForPromise.all`.
 * Receives the extra arguments (and, in `sequence`, all previous results
 * appended in order). May return a promise or a plain value.
 * @callback StepFunction
 * @param {...any} args
 * @returns {any}
 */



/**
 * Object with a promise and related helper functions. Returned
 * by `askForPromise()`, `askForPromise(list)`, `askForPromise.sequence(...)`
 * and `askForPromise.all(...)`.
 * @typedef {Object} AskObject
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
 * @property {(ttl: number, expMsg?: any) => AskObject} timeout - Arms a
 *   `ttl`-millisecond timer, replacing any previous timer. On expiry, a
 *   single promise resolves with `expMsg`; in list mode each still-pending
 *   item resolves with `expMsg`, while settled items keep their values.
 *   `promise` and `onComplete` receive the same result. Returns the same task.
 */



/**
 * `AskObject` returned by `askForPromise(list)`. Same API as
 * `AskObject`, with list-specific types.
 * @typedef {Object} AskListObject
 * @property {Promise<any[]>} promise - `Promise.all` over every sub-promise.
 *   Resolves to an array of values in input order.
 * @property {AskObject[]} promises - One `AskObject` per list item. Use
 *   `task.promises[i].done(value)` to resolve a single item.
 * @property {(value?: any) => void} done - Resolves every sub-promise with
 *   the same value. Clears the list-level timer, if any.
 * @property {(reason?: any) => void} cancel - Rejects every sub-promise with
 *   the same reason. Clears the list-level timer, if any.
 * @property {(cbFn: EachListCallback, ...args: any[]) => void} each - Calls
 *   `cbFn({ value, done, cancel, timeout }, index, ...args)` for each item.
 * @property {(fx: (result: any) => void, rejectFx?: ((error: any) => void) | null) => void} onComplete
 *   Sugar for `promise.then`. Pass a second function as the reject handler.
 * @property {(ttl: number, expMsg?: any) => AskListObject} timeout - Arms a
 *   list-level timer. On expiry each still-pending sub-promise settles with
 *   `expMsg`. Returns the same `AskListObject` so the call can be chained.
 */



/**
 * Internal slot for the active timer. Not part of the public API.
 * @private
 * @typedef {Object} TimerSlot
 * @property {ReturnType<typeof setTimeout> | null} _activeTimer
 */



/**
 * Creates a single-promise `AskObject`.
 * @overload
 * @returns {AskObject}
 */
/**
 * Creates one sub-promise per item in `list`, bundled into a single
 * `AskListObject` whose `promise` is `Promise.all(...)`.
 * @overload
 * @param {any[]} list - List of items; each gets its own sub-promise.
 * @returns {AskListObject}
 */
/**
 * @overload
 * @param {any[] | null} [list] - Optional. List of items; omit for a single promise.
 * @returns {AskObject}
 */
/**
 * Creates an `AskObject` with a single promise, or one promise per item in
 * `list` (in which case all sub-promises are bundled into a single
 * `AskListObject` whose `promise` is `Promise.all(...)`).
 * @param {any[] | null} [list] - Optional. List of items; each gets its own
 *   sub-promise. Omit for a single promise.
 * @returns {AskObject | AskListObject} Object with the promise and related helper functions.
 */
function askForPromise ( list ) {
        if ( list ) return _manyPromises ( list )
        else        return _singlePromise ();
 } // askForPromise func.



/**
 * Executes a list of step functions one after the other. Each step is
 * called with the original `...args` plus all previous results appended in
 * order. The returned `task.promise` resolves to an array of every step's
 * resolved value once the chain completes; if any step rejects (or throws
 * synchronously) the task rejects with that error and the chain stops.
 * @function sequence
 * @memberof askForPromise
 * @param {StepFunction[]} list - Steps; each is expected to
 *   return a promise (a non-thenable return is accepted via `Promise.resolve`
 *   and treated as a resolved value).
 * @param {...any} args - Arguments passed to the first step. Each step
 *   additionally receives all previous results as arguments.
 * @returns {AskObject} `AskObject` whose `promise` resolves to the array of
 *   step results (in order), or rejects on the first step failure.
 */
 askForPromise.sequence = function promiseInSequence ( list, ...args ) {
  const
        task = askForPromise ()
      , /** @type {any[]} */ result = []
      ;

  /** @param {StepFunction[]} n */
  function* listGen ( n ) {   for ( const el of n ) { yield el }}
  const g = listGen ( list );

  /**
   * @param {IteratorResult<StepFunction>} n
   * @param {...any} args
   */
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
 * @param {Array<StepFunction | PromiseLike<any>>} list - Steps to
 *   run in parallel; each is either a function or a thenable.
 * @param {...any} args - Arguments passed to each step function. Ignored
 *   for thenable entries.
 * @returns {AskObject} `AskObject` whose `promise` resolves to the array of
 *   step results (in order), or rejects on the first step failure.
 */
askForPromise.all = function promiseAll ( list, ...args ) {
  const
        task = askForPromise ()
      , /** @type {any[]} */ result = []
      ;
  /** @type {Promise<any>[]} */
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
  /** @type {(value?: any) => void} */
  let  done
  /** @type {(reason?: any) => void} */
  let  cancel
  ;
  const x = new Promise ( (resolve, reject ) => {
                                                  done   = resolve
                                                  cancel = reject
                                 })
    // Internal slot for the active timer (if any).
    /** @type {AskObject & TimerSlot} */
    const askObject = {
               promise       : x
             , promises      : null
             , _activeTimer  : null
             , done          : () => {}
             , cancel        : () => {}
             , each          : () => {}
             , onComplete    : _after(x)
             , timeout       : _timeout ()
           }

    // Bare callbacks must also clear the timer, so retain the task in these
    // wrappers. JavaScript garbage collectors can reclaim unreachable cycles.
    askObject.done   = function ( value )  { if (askObject._activeTimer !== null) { clearTimeout(askObject._activeTimer); askObject._activeTimer = null } done(value) }
    askObject.cancel = function ( reason ) { if (askObject._activeTimer !== null) { clearTimeout(askObject._activeTimer); askObject._activeTimer = null } cancel(reason) }

    // `timeout` is wrapped so it runs with the askObject as `this` (it is
    // called as `ctx.timeout(...)`). `undefined` fills the `index` slot so
    // extra args land in the same position as in list mode.
    askObject.each = function (cbFn, ...args) { cbFn({value: null, done: askObject.done, cancel: askObject.cancel, timeout: (ttl, expMsg) => this.timeout(ttl, expMsg)}, undefined, ...args) }

    return askObject
   } // _singlePromise func.



/**
 * Creates a list-mode `AskObject` where each item in `list` gets its own
 * sub-promise, all controlled by a single returned `AskObject`. Internal —
 * use `askForPromise(list)`.
 * @private
 * @param {Array<any>} list - List of items; each becomes a separate
 *   sub-promise.
 * @returns {AskListObject} `AskListObject` whose `promise` is `Promise.all` over
 *   every sub-promise, `promises` is the array of sub-`AskObject`s, and
 *   `done` / `cancel` settle every sub-promise with the same value.
 */
 function _manyPromises ( list ) {
                                    let listOfPromiseObjects = list.map ( el => _singlePromise() )
                                    let listOfPromises   = listOfPromiseObjects.map ( o => o.promise )

                                    // One shared `Promise.all` for `promise` and `onComplete`. A
                                    // second, unobserved `Promise.all` would reject unhandled
                                    // whenever an item is cancelled.
                                    const all = Promise.all ( listOfPromises )

                                    // Keep the original values for the each callback.
                                    /** @type {AskListObject & TimerSlot & { _list: any[] }} */
                                    const askObject = {
                                                  promise       : all
                                                , promises      : listOfPromiseObjects
                                                , _list         : list
                                                , _activeTimer  : null
                                                , done          : () => {}
                                                , cancel        : () => {}
                                                , each          : () => {}
                                                , onComplete    : _after ( all )
                                                , timeout       : _timeout ()
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
                                                                                        timeout: ( ttl, expMsg ) => prom.timeout ( ttl, expMsg )
                                                                                    },
                                                                                    i,
                                                                                    ...args
                                                                                  ))
                                    }

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
 * Builds the timeout method shared by single and list tasks. A timer keeps
 * the task alive until it settles or expires, even if only its promise is
 * retained. Re-arming a timeout replaces the previous timer.
 * @private
 * @returns {<T extends AskObject>(this: T & TimerSlot, ttl: number, expMsg?: any) => T}
 */
function _timeout () {
  return function timeout ( ttl, expMsg ) {
            const task = this
            if ( task._activeTimer !== null ) clearTimeout ( task._activeTimer )
            const timer = setTimeout ( () => task.done ( expMsg ), ttl )
            task._activeTimer = timer
            // Observe both outcomes to avoid an unhandled cleanup rejection.
            // Check the handle so an older timeout cannot clear a newer one.
            const clear = () => {
                clearTimeout ( timer )
                if ( task._activeTimer === timer ) task._activeTimer = null
            }
            task.promise.then ( clear, clear )
            return task
        }
} // _timeout func.


export default askForPromise


