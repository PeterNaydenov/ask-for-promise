'use strict'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import askForPromise from '../src/askForPromise.js'
import bundled from '../dist/ask-for-promise.cjs'
import { expect } from 'chai';



const folder = fileURLToPath ( new URL ( '../skills/ask-for-promise/', import.meta.url ) );
const examples = readFileSync ( join ( folder, 'references/examples.md' ), 'utf8' );
const AsyncFunction = Object.getPrototypeOf ( async function () {} ).constructor;
const headings = [
          'Await a callback API'
        , 'Race: first to settle wins'
        , 'Timeout with a fallback'
        , 'Steps in sequence'
        , 'Steps in parallel'
        , 'One promise per list item'
        , 'Per-item timeout'
        , 'Long chain of named steps'
    ];



// A section is a heading and everything up to the next heading. The code
// block of a section is its first one. A section may hold a note before it.
const sections = examples.split ( /^## /m ).slice ( 1 ).map ( section => ({
          heading : section.split ( '\n' )[0].trim()
        , code    : section.match ( /```js\n([\s\S]*?)\n```/ )?.[1]
    }) );



// The examples call services that are not part of the library. These stand in
// for them. A call that never answers lets the timeout examples settle.
const stubs = {
          legacyApi  : ( input, callback ) => setTimeout ( () => callback ( null, 'value' ), 1 )
        , fetchFromCache    : () => Promise.resolve ( 'cache' )
        , fetchFromNetwork  : () => new Promise ( () => {} )
        , slowApi    : () => {}
        , getUser    : userId => Promise.resolve ({ id:userId })
        , getPosts   : () => Promise.resolve ([ 'post' ])
        , renderPage : () => Promise.resolve ( 'html' )
        , fetchA     : () => Promise.resolve ( 'a' )
        , fetchB     : () => Promise.resolve ( 'b' )
        , fetchC     : () => Promise.resolve ( 'c' )
        , readFile   : ( value, encoding, callback ) => setTimeout ( () => callback ( null, 'text-' + value ), 1 )
        , request    : () => {}
        , makeFolders: ( folders, callback ) => setTimeout ( callback, 1 )
        , saveFiles  : ( files, callback ) => setTimeout ( callback, 1 )
    };

// The data the examples read. A snippet that declares a name of its own keeps
// it, so the value is only added when the snippet does not declare it.
const data = {
          input      : 'input'
        , key        : 'key'
        , userId     : 7
        , token      : 'token'
        , urls       : ['u1','u2']
        , folders    : ['f1']
        , files      : ['f1.txt']
    };

// The bindings the examples are read through. Every example declares a
// different set, so a missing one is reported as `undefined` instead of
// breaking the whole run.
const returned = [
          'task'
        , 'result'
        , 'texts'
        , 'bodies'
        , 'user'
        , 'posts'
        , 'html'
        , 'a'
        , 'b'
        , 'c'
        , 'prepareFolders'
        , 'writeFiles'
    ];



/**
 *  Runs the documented examples against an implementation. The source and the
 *  shipped bundle are both checked. The bundle is what the consumers get and
 *  it is built separately from the source.
 *
 *  The timeout examples wait for a service that never answers. Their literal
 *  durations are shortened so the suite stays fast. The shape of the example
 *  is not changed.
 */
async function runExample ( heading, implementation ) {
    const section = sections.find ( entry => entry.heading === heading );
    if ( !section?.code )   throw new Error ( 'No documented example for: ' + heading )
    const source = section.code
                    .replace ( /^import .*\n/gm, '' )
                    .replace ( /timeout\s*\(\s*(\d+)\s*,/g, ( match, duration ) => 'timeout (' + Math.min ( Number ( duration ), 20 ) + ',' );
    const preamble = Object.entries ( data )
                    .filter ( ( [ name ] ) => !new RegExp ( '\\b(const|let|var)\\s+' + name + '\\b' ).test ( source ) )
                    .map ( ( [ name, value ] ) => 'const ' + name + ' = ' + JSON.stringify ( value ) + ';' )
                    .join ( '\n' );
    const collect = returned.map ( name => name + ': typeof ' + name + " === 'undefined' ? undefined : " + name ).join ( ', ' );
    const body = preamble + '\n' + source + '\nreturn { ' + collect + ' }';
    const names = Object.keys ( stubs );
    return new AsyncFunction ( 'askForPromise', ...names, body ) ( implementation, ...names.map ( name => stubs[name] ) )
} // runExample func.



describe ( 'ask-for-promise - portable skill', () => {

    it ( 'Keep all documented examples in the reference file', () => {
                const found = sections.filter ( entry => entry.code ).map ( entry => entry.heading );
                expect ( found ).to.deep.equal ( headings )
    }) // it Documented example inventory



    for ( const [ origin, implementation ] of [ ['source', askForPromise], ['bundle', bundled] ] ) {

        describe ( 'Skill examples from the ' + origin, () => {

            it ( 'Await a callback API', async () => {
                        const { task } = await runExample ( 'Await a callback API', implementation );
                        expect ( await task.promise ).to.be.equal ( 'value' )
                }) // it Await a callback API



            it ( 'Race: first to settle wins', async () => {
                        const { task } = await runExample ( 'Race: first to settle wins', implementation );
                        expect ( await task.promise ).to.be.equal ( 'cache' )
                }) // it Race



            it ( 'Timeout with a fallback', async () => {
                        const { task } = await runExample ( 'Timeout with a fallback', implementation );
                        expect ( await task.promise ).to.be.equal ( 'timeout' )
                }) // it Timeout with a fallback



            it ( 'Steps in sequence', async () => {
                        const { user, posts, html } = await runExample ( 'Steps in sequence', implementation );
                        expect ( user ).to.deep.equal ({ id:7 })
                        expect ( posts ).to.deep.equal ([ 'post' ])
                        expect ( html ).to.be.equal ( 'html' )
                }) // it Steps in sequence



            it ( 'Steps in parallel', async () => {
                        const { a, b, c } = await runExample ( 'Steps in parallel', implementation );
                        expect ( [a,b,c] ).to.deep.equal ([ 'a','b','c' ])
                }) // it Steps in parallel



            it ( 'One promise per list item', async () => {
                        const { task, texts } = await runExample ( 'One promise per list item', implementation );
                        expect ( texts ).to.deep.equal ([ 'text-a.txt','text-b.txt','text-c.txt' ])
                        expect ( await task.promise ).to.deep.equal ( texts )
                }) // it One promise per list item



            it ( 'Per-item timeout', async () => {
                        const { task, bodies } = await runExample ( 'Per-item timeout', implementation );
                        expect ( bodies ).to.deep.equal ([ null, null ])
                        expect ( await task.promise ).to.deep.equal ( bodies )
                }) // it Per-item timeout



            it ( 'Long chain of named steps', async () => {
                        const { prepareFolders, writeFiles } = await runExample ( 'Long chain of named steps', implementation );
                        expect ( await prepareFolders.promise ).to.be.undefined
                        expect ( await writeFiles.promise ).to.be.undefined
                }) // it Long chain of named steps

        }) // describe Source and bundle
    }

}) // describe
