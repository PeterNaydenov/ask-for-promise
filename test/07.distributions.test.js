'use strict'

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { expect } from 'chai';
import askForPromise from '../src/askForPromise.js'
import packaged from 'ask-for-promise'


const require = createRequire ( import.meta.url );
const source = readFileSync ( new URL ( '../dist/ask-for-promise.umd.js', import.meta.url ), 'utf8' );

// The UMD bundle serves three kinds of consumer. Each one gets its own
// context, and each one has to end up with a working library.
const browser = { setTimeout, clearTimeout, WeakRef: undefined };
runInNewContext ( source, browser )

const commonjs = { module:{ exports:{} }, exports:{}, setTimeout, clearTimeout };
runInNewContext ( source, commonjs )

// The AMD signature is 'define ( dependencies, factory )'. The factory only
// shorthand is accepted as well, so the mock works with every wrapper. The
// arguments are kept to check the signature itself.
let amd, amdArgs;
const define = ( ...args ) => { amdArgs = args; amd = ( typeof args[0] === 'function' ? args[0] : args[1] )() };
define.amd = true
runInNewContext ( source, { define, setTimeout, clearTimeout } )

const distributions = [
          ['Source', askForPromise]
        , ['CommonJS bundle', require ( '../dist/ask-for-promise.cjs' )]
        , ['UMD browser', browser.askForPromise]
        , ['UMD CommonJS', commonjs.module.exports]
        , ['UMD AMD', amd]
        , ['Package import', packaged]
        , ['Package require', require ( 'ask-for-promise' )]
    ];



describe ( 'ask-for-promise: generated distributions', () => {

    it ( 'The UMD bundle exposes the global in a browser', () => {
                expect ( typeof browser.askForPromise ).to.be.equal ( 'function' )
    }) // it UMD global



    it ( 'The UMD bundle calls the AMD loader with the standard signature', () => {
                expect ( Array.isArray ( amdArgs[0] ) ).to.be.equal ( true )
                expect ( typeof amdArgs[1] ).to.be.equal ( 'function' )
    }) // it AMD signature



    for ( const [ name, ask ] of distributions ) {

        it ( name + ' resolves a promise', async () => {
                        const task = ask ();
                        task.done ( 'value' )
                        expect ( await task.promise ).to.be.equal ( 'value' )
                }) // it Resolves a promise



        it ( name + ' runs the steps in sequence', async () => {
                        // Every step receives the original arguments and the
                        // result of the step before it, appended last.
                        const task = ask.sequence ([ () => Promise.resolve (1), ( arg, previous ) => Promise.resolve ( previous + 1 ) ], 'x' );
                        expect ( await task.promise ).to.deep.equal ([ 1, 2 ])
                }) // it Sequence



        it ( name + ' runs the steps in parallel', async () => {
                        const task = ask.all ([ () => Promise.resolve ('a'), () => Promise.resolve ('b') ], 'x' );
                        expect ( await task.promise ).to.deep.equal ([ 'a','b' ])
                }) // it All



        it ( name + ' settles a timeout with the fallback', async () => {
                        const task = ask ().timeout ( 10, 'fallback' );
                        expect ( await task.promise ).to.be.equal ( 'fallback' )
                }) // it Timeout

        it ( name + ' delivers the same list timeout result to both completion paths', async () => {
                        const task = ask ([ 'a', 'b' ]).timeout ( 10, 'fallback' );
                        task.promises[0].done ( 'ready' )
                        const completed = new Promise ( resolve => task.onComplete ( resolve ) );
                        expect ( Array.from ( await task.promise ) ).to.deep.equal ([ 'ready', 'fallback' ])
                        expect ( Array.from ( await completed ) ).to.deep.equal ([ 'ready', 'fallback' ])
                })



        it ( name + ' resolves one promise per list item', async () => {
                        const task = ask ([ 'x','y' ]);
                        task.each ( ({ value, done }) => done ( value.toUpperCase () ) )
                        expect ( await task.promise ).to.deep.equal ([ 'X','Y' ])
                }) // it List mode

    } // for Every distribution

}) // describe
