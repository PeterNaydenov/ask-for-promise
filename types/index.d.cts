// CommonJS type definitions (`const askForPromise = require('ask-for-promise')`).
// Mirrors the JSDoc in `src/askForPromise.js`. Keep in sync with `index.d.ts`.

/**
 * Creates a single-promise `AskObject`.
 */
declare function askForPromise(): askForPromise.AskObject;
/**
 * Creates one sub-promise per item in `list`, bundled into a single
 * `AskListObject` whose `promise` is `Promise.all(...)`.
 * @param list - List of items; each gets its own sub-promise.
 */
declare function askForPromise(list: any[]): askForPromise.AskListObject;
/**
 * Creates an `AskObject` with a single promise, or one promise per item in `list`.
 * @param list - Optional. List of items; omit for a single promise.
 */
declare function askForPromise(list?: any[] | null): askForPromise.AskObject;

declare namespace askForPromise {
    /**
     * Per-item context passed to the `each` callback. Carries the underlying
     * value plus per-item controls (`done` / `cancel` / `timeout`).
     */
    interface EachContext {
        /** The list item passed to `askForPromise(list)`. In single-promise mode this is `null`. */
        value: any;
        /**
         * Resolves this single item. In list mode this settles one sub-promise;
         * in single mode it settles the main promise. Clears the pending timer
         * for this item, if any.
         */
        done: (value?: any) => void;
        /** Rejects this single item. Clears the pending timer for this item, if any. */
        cancel: (reason?: any) => void;
        /** Per-item timeout helper. Returns the item's `AskObject` (in single mode, the task itself). */
        timeout: (ttl: number, expMsg?: any) => AskObject;
    }

    /**
     * Callback invoked by `askObject.each()`.
     * @param ctx - Per-item context (value + done / cancel / timeout).
     * @param index - Position of the item in the input list. `undefined` in single mode.
     * @param args - Extra arguments forwarded from `task.each(cbFn, ...args)`.
     */
    type EachCallback = (ctx: EachContext, index: number | undefined, ...args: any[]) => void;

    /**
     * Callback invoked once per list item by `askListObject.each()`.
     * @param ctx - Per-item context (value + done / cancel / timeout).
     * @param index - Position of the item in the input list.
     * @param args - Extra arguments forwarded from `task.each(cbFn, ...args)`.
     */
    type EachListCallback = (ctx: EachContext, index: number, ...args: any[]) => void;

    /**
     * A step for `askForPromise.sequence` / `askForPromise.all`. Receives the
     * extra arguments (and, in `sequence`, all previous results appended in
     * order). May return a promise or a plain value.
     */
    type StepFunction = (...args: any[]) => any;

    /**
     * Object with a promise and related helper functions. Returned by
     * `askForPromise()`, `askForPromise.sequence(...)` and `askForPromise.all(...)`.
     */
    interface AskObject {
        /** The underlying promise. */
        promise: Promise<any>;
        /** `AskObject[]` in list mode, `null` in single mode. */
        promises: AskObject[] | null;
        /**
         * Resolves the promise (or all sub-promises with the same value, in list
         * mode). Clears the pending `.timeout()` timer, if any.
         */
        done: (value?: any) => void;
        /**
         * Rejects the promise (or all sub-promises with the same reason, in list
         * mode). Clears the pending `.timeout()` timer, if any.
         */
        cancel: (reason?: any) => void;
        /**
         * Calls `cbFn({ value, done, cancel, timeout }, index, ...args)` for each
         * item. In single mode the callback is invoked once with `value: null`
         * and `index: undefined`.
         */
        each: (cbFn: EachCallback, ...args: any[]) => void;
        /** Sugar for `promise.then`. Pass a second function as the reject handler. */
        onComplete: (fx: (result: any) => void, rejectFx?: ((error: any) => void) | null) => void;
        /**
         * Arms a `ttl`-millisecond timer, replacing any previous timer. On expiry,
         * a single promise resolves with `expMsg`. In list mode each still-pending
         * item resolves with `expMsg`; already settled items keep their
         * value. Both completion methods receive the same result. Returns the same object.
         */
        timeout: (ttl: number, expMsg?: any) => this;
    }

    /**
     * `AskObject` returned by `askForPromise(list)`. Same API as `AskObject`,
     * with list-specific types.
     */
    interface AskListObject extends AskObject {
        /** `Promise.all` over every sub-promise. Resolves to an array of values in input order. */
        promise: Promise<any[]>;
        /** One `AskObject` per list item. Use `task.promises[i].done(value)` to resolve a single item. */
        promises: AskObject[];
        /** Calls `cbFn({ value, done, cancel, timeout }, index, ...args)` for each item. */
        each: (cbFn: EachListCallback, ...args: any[]) => void;
    }

    /**
     * Executes a list of step functions one after the other. Each step is
     * called with the original `...args` plus all previous step results
     * appended in order. `task.promise` resolves to an array of every
     * step's result; if any step rejects (or throws) the task rejects with
     * that error and the chain stops.
     * @param list - Steps; each may return a promise or a plain value.
     * @param args - Arguments passed to the first step.
     */
    function sequence(list: StepFunction[], ...args: any[]): AskObject;
    /**
     * Executes a list of steps in parallel. Each entry is a function (called
     * with `...args`) or an already-running promise. `task.promise` resolves
     * to an array of results in declaration order; if any entry rejects (or
     * a step throws) the task rejects with that error.
     * @param list - Steps to run in parallel; each is a function or a thenable.
     * @param args - Arguments passed to each step function.
     */
    function all(list: Array<StepFunction | PromiseLike<any>>, ...args: any[]): AskObject;
}

export = askForPromise;
