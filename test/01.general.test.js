'use strict'

import askForPromise from '../src/askForPromise.js'
import { expect } from 'chai';


describe ( 'askForPromise - general', () => {

    it ( 'done (resolve)', async () => {
        const task = askForPromise ()
        let completed = false
        const observed = task.promise.then ( result => {
            completed = true
            return result
        })
        task.done ( 'success' )
        expect ( completed ).to.equal ( false )
        expect ( await observed ).to.equal ( 'success' )
        expect ( completed ).to.equal ( true )
    })

    it ( 'cancel (reject)', async () => {
        const task = askForPromise ()
        const observed = task.promise.then (
            () => { throw new Error ( 'should have rejected' ) },
            reason => reason
        )
        task.cancel ( 'bad' )
        expect ( await observed ).to.equal ( 'bad' )
    })

    it ( 'promise.all', async () => {
        const tasks = [ 2, 5, 1, 4 ].map ( () => askForPromise () )
        const result = Promise.all ( tasks.map ( task => task.promise ) )
        // Complete out of order; results still follow declaration order.
        tasks[2].done ( 1 )
        tasks[0].done ( 2 )
        tasks[3].done ( 4 )
        tasks[1].done ( 5 )
        expect ( await result ).to.deep.equal ([ 2, 5, 1, 4 ])
    })

    it ( 'promise.race', async () => {
        const tasks = [ 2, 5, 1, 4 ].map ( () => askForPromise () )
        const result = Promise.race ( tasks.map ( task => task.promise ) )
        tasks[2].done ( 1 )
        tasks[0].done ( 2 )
        tasks[3].done ( 4 )
        tasks[1].done ( 5 )
        expect ( await result ).to.equal ( 1 )
    })

    it ( 'Alternative promise race', async () => {
        const task = askForPromise ()
        task.done ( 'first' )
        task.done ( 'second' )
        expect ( await task.promise ).to.equal ( 'first' )
    })

    it ( 'Chain of promises', async () => {
        const result = []
        const step1 = askForPromise ()
        const step2 = askForPromise ()
        const step3 = askForPromise ()
        step1.done ()
        const chain = step1.promise.then ( () => {
            result.push ( 'step 1' )
            step2.done ()
            return step2.promise
        }).then ( () => {
            result.push ( 'step 2' )
            step3.done ()
            return step3.promise
        }).then ( () => result.push ( 'step 3' ) )
        result.push ( 'start' )
        await chain
        expect ( result ).to.deep.equal ([ 'start', 'step 1', 'step 2', 'step 3' ])
    })

    it ( 'Array of promises', async () => {
        const task = askForPromise ([ 1, 2, 3 ])
        task.done ( 'shared' )
        expect ( await task.promise ).to.deep.equal ([ 'shared', 'shared', 'shared' ])
        expect ( await Promise.all ( task.promises.map ( item => item.promise ) ) ).to.deep.equal ([ 'shared', 'shared', 'shared' ])
    })

    it ( 'Array of promises (each)', async () => {
        const list = [ 1, 2, 3 ]
        const task = askForPromise ( list )
        task.each ( ({ value, done }, index) => {
            expect ( index ).to.equal ( list.indexOf ( value ) )
            done ( value )
        })
        expect ( await task.promise ).to.deep.equal ( list )
    })

    it ( 'Single promise (each) keeps the index slot', async () => {
        const task = askForPromise ()
        task.each ( ({ value, done }, index, extra) => {
            expect ( value ).to.equal ( null )
            expect ( index ).to.equal ( undefined )
            expect ( extra ).to.equal ( 'extra' )
            done ( extra )
        }, 'extra' )
        expect ( await task.promise ).to.equal ( 'extra' )
    })
})


// ============================================================================
// Regression: `sequence` and `all` used to silently swallow rejections from
// their step functions. A rejected step promise left the returned task pending
// forever — the rejection never reached `task.promise`, so calling code had no
// way to detect the failure. Same problem for synchronous throws inside a
// step. Fix: catch both cases and forward them to `task.cancel(err)`.
// ============================================================================

describe ( 'sequence / all rejection handling', () => {

    it ( 'sequence rejects the task when a step returns a rejected promise', async () => {
        const steps = [
                    () => Promise.resolve ( 1 )
                  , () => Promise.reject ( new Error ( 'step 2 failed' ) )
                  , () => Promise.resolve ( 3 )   // should never run
                ]
        const task = askForPromise.sequence ( steps, 0 )

        let caught
        try { await task.promise }
        catch ( err ) { caught = err }

        expect ( caught ).to.be.instanceof ( Error )
        expect ( caught.message ).to.be.equal ( 'step 2 failed' )
    })


    it ( 'all rejects the task when any step returns a rejected promise', async () => {
        const fns = [
                    () => Promise.resolve ( 1 )
                  , () => Promise.reject ( new Error ( 'parallel step failed' ) )
                  , () => Promise.resolve ( 3 )
                ]
        const task = askForPromise.all ( fns, 0 )

        let caught
        try { await task.promise }
        catch ( err ) { caught = err }

        expect ( caught ).to.be.instanceof ( Error )
        expect ( caught.message ).to.be.equal ( 'parallel step failed' )
    })


    it ( 'sequence rejects the task when a step throws synchronously', async () => {
        const steps = [
                    () => Promise.resolve ( 1 )
                  , () => { throw new Error ( 'sync throw in sequence' ) }
                  , () => Promise.resolve ( 3 )   // should never run
                ]
        const task = askForPromise.sequence ( steps, 0 )

        let caught
        try { await task.promise }
        catch ( err ) { caught = err }

        expect ( caught ).to.be.instanceof ( Error )
        expect ( caught.message ).to.be.equal ( 'sync throw in sequence' )
    })


    it ( 'all rejects the task when a step function throws synchronously', async () => {
        const fns = [
                    () => Promise.resolve ( 1 )
                  , () => { throw new Error ( 'sync throw in all' ) }
                  , () => Promise.resolve ( 3 )
                ]
        const task = askForPromise.all ( fns, 0 )

        let caught
        try { await task.promise }
        catch ( err ) { caught = err }

        expect ( caught ).to.be.instanceof ( Error )
        expect ( caught.message ).to.be.equal ( 'sync throw in all' )
    })


    it ( 'sequence rejects when a list entry is not a function (instead of throwing)', async () => {
        // Before the fix: `n.value is not a function` propagated out of
        // askForPromise.sequence as a synchronous throw — there was no task
        // to reject, so callers had no way to catch it. Now the error is
        // surfaced via task.promise so the contract is uniform.
        const steps = [ () => Promise.resolve ( 1 ), 'not a function' ]
        const task = askForPromise.sequence ( steps, 0 )

        let caught
        try { await task.promise }
        catch ( err ) { caught = err }

        expect ( caught ).to.be.instanceof ( TypeError )
    })

}) // describe rejection handling



