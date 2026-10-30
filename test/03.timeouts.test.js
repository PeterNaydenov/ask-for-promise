'use strict'

import askForPromise from '../src/askForPromise.js'
import { expect } from 'chai';
import { execFileSync } from 'node:child_process'



describe ( 'askForPromise - "Timeout" function', () => {
    
    it ( 'Timeout: Single Promise with completion', async () => {
        const task = askForPromise ().timeout ( 100, 'timeout' )
        const completed = new Promise ( (resolve, reject) => task.onComplete ( resolve, reject ) )
        task.done ( 'standard' )
        expect ( await completed ).to.equal ( 'standard' )
    })

    it ( 'Timeout: Single Promise with timeout', async () => {
        const task = askForPromise ().timeout ( 20, 'expire' )
        const completed = new Promise ( (resolve, reject) => task.onComplete ( resolve, reject ) )
        expect ( await completed ).to.equal ( 'expire' )
        task.done ( 'late result' )
        expect ( await task.promise ).to.equal ( 'expire' )
    })

    it ( 'Timeout: Multiple promises with completion', async () => {
        const list = [ 2, 50, 10, 40 ]
        const task = askForPromise ( list ).timeout ( 100, 'finish' )
        const completed = new Promise ( (resolve, reject) => task.onComplete ( resolve, reject ) )
        task.each ( ({ value, done }) => done ( value ) )
        expect ( await completed ).to.deep.equal ( list )
    })

    it ( 'Timeout: list promise and onComplete receive the same results', async () => {
        const task = askForPromise ([ 1, 2 ]).timeout ( 20, 'finish' )
        task.promises[0].done ( 'ready' )
        const completed = new Promise ( resolve => task.onComplete ( resolve ) )
        expect ( await task.promise ).to.deep.equal ([ 'ready', 'finish' ])
        expect ( await completed ).to.deep.equal ([ 'ready', 'finish' ])
    })

    it ( 'Timeout: retaining only the promise survives garbage collection', () => {
        const source = new URL ( '../src/askForPromise.js', import.meta.url ).href
        const code = `import ask from ${JSON.stringify(source)};
            const promise = ask().timeout(100, 'fallback').promise;
            const gc = setInterval(() => global.gc(), 5);
            const result = await Promise.race([promise, new Promise(r => setTimeout(() => r('pending'), 300))]);
            clearInterval(gc);
            if (result !== 'fallback') throw new Error('Timed promise did not settle');`
        execFileSync ( process.execPath, [ '--expose-gc', '--input-type=module', '-e', code ], { timeout: 5000 } )
    })

    it ( 'Timeout: rearming replaces the previous timer', async () => {
        const task = askForPromise ().timeout ( 10, 'old' ).timeout ( 30, 'new' )
        expect ( await task.promise ).to.equal ( 'new' )
    })



    // Regression: previously, when the timer fired, the askObject's
    // `done`/`cancel` were never invoked. `task.promise` stayed pending
    // forever (or until the underlying work eventually finished) and any
    // in-flight resources (hung fetches, pending timers) kept the task
    // alive. Now the timer also calls `askObject.done(expMsg)`, so the
    // underlying promise settles with the fallback.

    it ( 'Timeout: Single — task.promise settles with the fallback', async () => {
        const task = askForPromise ().timeout ( 20, 'expire' )
        // never call task.done() — let the timer fire
        const r = await task.promise
        expect ( r ).to.be.equal ( 'expire' )
    }) // it single settles after timeout



    it ( 'Timeout: List — task.promise settles with an array of fallbacks for still-pending items', async () => {
        const list = [ 2, 60, 10, 200 ]
        const task = askForPromise ( list ).timeout ( 40, 'finish' )
        list.forEach ( (el,i) => setTimeout ( () => task.promises[i].done(el), el ) )

        const r = await task.promise
        expect ( r ).to.be.an ( 'array' )
        expect ( r ).to.have.length ( 4 )
        // Sub-promises at 2ms and 10ms finished in time with their real values
        // (order matches input list). Sub-promises at 60ms and 200ms were still
        // pending when the timer fired at 40ms, so they got the fallback.
        expect ( r[0] ).to.be.equal ( 2 )
        expect ( r[2] ).to.be.equal ( 10 )
        expect ( r[1] ).to.be.equal ( 'finish' )
        expect ( r[3] ).to.be.equal ( 'finish' )
    }) // it list settles after timeout



    it ( 'Timeout: Single — task.promise stays consistent with onComplete', async () => {
        const task = askForPromise ().timeout ( 20, 'expire' )
        let fromOnComplete
        task.onComplete ( r => { fromOnComplete = r } )
        const fromAwait = await task.promise
        await new Promise ( resolve => setTimeout ( resolve, 5 ) )
        expect ( fromOnComplete ).to.be.equal ( 'expire' )
        expect ( fromAwait ).to.be.equal ( 'expire' )
    }) // it single onComplete and promise agree



    // Regression: previously, calling task.done or task.cancel on a task with
    // an active .timeout() left the setTimeout running. The setTimeout
    // callback captured the askObject (and, in list mode, the per-item
    // askObjects via askObject.promises), so dropping the reference did not
    // release them until the timer fired. The fix: wrapped done/cancel now
    // clearTimeout the active handle so the askObject can be GC'd immediately.

    it ( 'Timeout: Single — done() clears the active timer', () => {
        // We can't directly observe a setTimeout being cleared, but we can
        // verify the askObject is settled synchronously (no waiting on the
        // timer) and that a follow-up .then fires in a microtask, not after
        // the timer would have fired.
        const task = askForPromise ().timeout ( 10_000, 'expire' )
        task.done ( 'manual' )
        // If the timer were still running, `done` would be a no-op (it
        // already was) but the wrapped done would have re-entered the
        // clearTimeout path. The assertion below confirms state: the promise
        // resolves with 'manual', not 'expire'.
        return task.promise.then ( r => {
            expect ( r ).to.be.equal ( 'manual' )
        })
    })

    it ( 'Timeout: Single — cancel() clears the active timer', () => {
        const task = askForPromise ().timeout ( 10_000, 'expire' )
        task.cancel ( 'user-cancelled' )
        return task.promise.then (
            () => { throw new Error ( 'should have rejected' ) },
            err => { expect ( err ).to.be.equal ( 'user-cancelled' ) }
        )
    })

    it ( 'Timeout: List — done() clears the active list-level timer', () => {
        const task = askForPromise ( [ 1, 2, 3 ] ).timeout ( 10_000, 'expire' )
        task.done ( 'manual' )
        return task.promise.then ( r => {
            expect ( r ).to.be.an ( 'array' )
            expect ( r ).to.have.length ( 3 )
            expect ( r[0] ).to.be.equal ( 'manual' )
            expect ( r[1] ).to.be.equal ( 'manual' )
            expect ( r[2] ).to.be.equal ( 'manual' )
        })
    })

    it ( 'Timeout: List — cancel() clears the active list-level timer', () => {
        const task = askForPromise ( [ 1, 2, 3 ] ).timeout ( 10_000, 'expire' )
        task.cancel ( 'user-cancelled' )
        return task.promise.then (
            () => { throw new Error ( 'should have rejected' ) },
            err => { expect ( err ).to.be.equal ( 'user-cancelled' ) }
        )
    })

    it ( 'Timeout: Single — each-callback done/cancel also clear the timer', () => {
        // The each callback hands out the wrapped done/cancel. Calling them
        // should also clear the per-item timer (and the askObject's
        // activeTimer, since this is a single-mode task).
        const task = askForPromise ().timeout ( 10_000, 'expire' )
        task.each ( ({ done }) => { done ( 'via-each' ) } )
        return task.promise.then ( r => {
            expect ( r ).to.be.equal ( 'via-each' )
        })
    })

    it ( 'Timeout: Single — each-callback timeout arms the task timer', async () => {
        const task = askForPromise ()
        let returned
        task.each ( ({ timeout }) => { returned = timeout ( 5, 'expire' ) } )
        expect ( returned ).to.be.equal ( task )
        const r = await task.promise
        expect ( r ).to.be.equal ( 'expire' )
    })

    it ( 'Timeout: List — each-callback timeout arms a per-item timer', async () => {
        const task = askForPromise ([ 'a', 'b' ])
        task.each ( ({ value, done, timeout }, i ) => {
                        const item = timeout ( 5, 'expire' )
                        expect ( item ).to.be.equal ( task.promises[i] )
                        if ( value === 'a' ) done ( value )
                })
        const r = await task.promise
        expect ( r ).to.be.deep.equal ([ 'a', 'expire' ])
    })

}) // describe





