'use strict'

import askForPromise from '../src/askForPromise.js'
import { expect } from 'chai';



describe ( 'askForPromise - "Timeout" function', () => {
    
    it ( 'Timeout: Single Promise with completion', () => {
            const task = askForPromise ().timeout ( 100, "timeout" )
            task.done ( 'standard' )
            task.onComplete ( ( r ) => { 
                        expect ( r ).to.be.equal ( 'standard', 'Function should close the promise.' )
                   })
       }) // it single with completion



    it ( 'Timeout: Single Promise with timeout', () => {
            const task = askForPromise (). timeout ( 20, 'expire' )
            setTimeout ( () => task.done('task'), 40 )
            task.onComplete ( r => {
                  expect ( r ).to.be.equal ( 'expire', 'Timeout should close the promise' )
              })
       }) // it single with timeout



    it ( 'Timeout: Multiple promises with completion', () => {
            const list = [ 2, 50, 10, 40 ];
            const task = askForPromise ( list ).timeout ( 100, "finish" )
            list.forEach ( ( el, i ) => { setTimeout ( () => task.promises[i].done ( el ), el )   })
            task
             .onComplete (  r  => {
                                        expect ( r ).to.be.an ( 'array' )
                                        expect ( r ).to.have.length ( 4 )
                 })
        }) // it multiple with completion



    it ( 'Timeout: Multipe promises with timeout', () => {
      const list = [ 2, 60, 10, 40 ];
      const task = askForPromise ( list ).timeout ( 40, "finish" )
            list.forEach ( (el,i) => setTimeout ( () => task.promises[i].done(el), el )   )
            task
             .onComplete ( r  => {
                                    expect ( r ).to.be.equal ('finish', 'Timeout should be applied' )
                 })
       }) // it multipe with timeout



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

}) // describe





