'use strict'

import askForPromise from '../src/askForPromise.js'
import { expect } from 'chai';


describe ( 'askForPromise - "onComplete" function', () => {

    it ( 'onComplete: One promise', async () => {
        const task = askForPromise ()
        let returned
        const result = new Promise ( (resolve, reject) => {
            returned = task.onComplete ( resolve, reject )
        })
        task.done ( 'success' )
        expect ( await result ).to.equal ( 'success' )
        expect ( returned ).to.equal ( undefined )
    })

    it ( 'onComplete: List of promises', async () => {
        const task = askForPromise ([ 'a', 'b', 'c', 'd' ])
        const completed = new Promise ( (resolve, reject) => task.onComplete ( resolve, reject ) )
        // Finish c, a, d, b; the callback must still receive a, b, c, d.
        task.promises[2].done ( 0 )
        task.promises[0].done ( 1 )
        task.promises[3].done ( 2 )
        task.promises[1].done ( 3 )
        expect ( await completed ).to.deep.equal ([ 1, 3, 0, 2 ])
    })

    it ( 'onComplete: Empty list of promises', async () => {
        const task = askForPromise ( [] )
        const result = new Promise ( (resolve, reject) => task.onComplete ( resolve, reject ) )
        expect ( await result ).to.deep.equal ( [] )
    })

    it ( 'onComplete: Alternative promise race', async () => {
        const task = askForPromise ()
        const result = new Promise ( (resolve, reject) => task.onComplete ( resolve, reject ) )
        task.done ( 'first' )
        task.done ( 'second' )
        expect ( await result ).to.equal ( 'first' )
    })
})
