'use strict'

import askForPromise from '../src/askForPromise.js'
import { expect } from 'chai';



/**
 * Runs `scenario`, waits for the rejection tracker to run, and returns
 * every rejection that no handler picked up.
 */
async function unhandledDuring ( scenario ) {
        const unhandled = []
        const listener = reason => unhandled.push ( reason )
        process.on ( 'unhandledRejection', listener )
        try {
                await scenario ()
                await new Promise ( r => setTimeout ( r, 20 ) )
            }
        finally {
                process.off ( 'unhandledRejection', listener )
            }
        return unhandled
} // unhandledDuring func.



describe ( 'Rejections handled by the caller stay handled', () => {

    it ( 'List: cancel() of the whole list', async () => {
            const unhandled = await unhandledDuring ( async () => {
                        const task = askForPromise ([ 1, 2 ])
                        task.cancel ( 'bad' )
                        const err = await task.promise.catch ( e => e )
                        expect ( err ).to.be.equal ( 'bad' )
                })
            expect ( unhandled ).to.be.deep.equal ( [] )
        })

    it ( 'List: cancel() of a single item', async () => {
            const unhandled = await unhandledDuring ( async () => {
                        const task = askForPromise ([ 1, 2 ])
                        task.each ( ({ value, done, cancel }) => value === 1 ? done ( value ) : cancel ( 'bad' ) )
                        const err = await task.promise.catch ( e => e )
                        expect ( err ).to.be.equal ( 'bad' )
                })
            expect ( unhandled ).to.be.deep.equal ( [] )
        })

    it ( 'Single: cancel() with an active timeout', async () => {
            const unhandled = await unhandledDuring ( async () => {
                        const task = askForPromise ().timeout ( 1000, 'late' )
                        task.cancel ( 'bad' )
                        const err = await task.promise.catch ( e => e )
                        expect ( err ).to.be.equal ( 'bad' )
                })
            expect ( unhandled ).to.be.deep.equal ( [] )
        })

    it ( 'List: cancel() with an active timeout', async () => {
            const unhandled = await unhandledDuring ( async () => {
                        const task = askForPromise ([ 1, 2 ]).timeout ( 1000, 'late' )
                        task.cancel ( 'bad' )
                        const err = await task.promise.catch ( e => e )
                        expect ( err ).to.be.equal ( 'bad' )
                })
            expect ( unhandled ).to.be.deep.equal ( [] )
        })

    it ( 'List: per-item timeout, then cancel() of that item', async () => {
            const unhandled = await unhandledDuring ( async () => {
                        const task = askForPromise ([ 1 ])
                        task.each ( ({ cancel, timeout }) => { timeout ( 1000, 'late' ); cancel ( 'bad' ) } )
                        const err = await task.promise.catch ( e => e )
                        expect ( err ).to.be.equal ( 'bad' )
                })
            expect ( unhandled ).to.be.deep.equal ( [] )
        })

    it ( 'onComplete reject handler still receives the error after a timeout', async () => {
            const unhandled = await unhandledDuring ( async () => {
                        const task = askForPromise ().timeout ( 1000, 'late' )
                        const err = await new Promise ( resolve => {
                                        task.onComplete ( () => resolve ( 'resolved' ), e => resolve ( e ) )
                                        task.cancel ( 'bad' )
                                })
                        expect ( err ).to.be.equal ( 'bad' )
                })
            expect ( unhandled ).to.be.deep.equal ( [] )
        })

}) // describe
