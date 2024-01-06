'use strict'

import askForPromise from '../src/askForPromise.js'
import { expect } from 'chai';



describe ( 'Promise list', () => {



    it ( 'Sequence property' , () => {
                expect ( askForPromise.sequence ).to.be.a ( 'function' )
        }) // it sequence of promises



    it ( 'All promises' , () => {
                expect ( askForPromise.all ).to.be.a ( 'function' )
        })



    it ( 'Sequence of async functions', done => {
                const
                      turn = []
                    , t1 = function () {
                                        const 
                                            task = askForPromise ()
                                            , lastArgument = [...arguments].slice(-1)[0]
                                            ;
                                        expect ( lastArgument ).to.be.equal ( 'h1' )
                                        setTimeout ( () => {
                                                        turn.push ( 1 )
                                                        task.done ( 'tt1' )
                                                }, 130 )
                                        return task.promise
                                }
                    // WARNING: "arguments" is available only in function declaration. 
                    // Do not use arrow function if you want to use arguments.
                    , t2 =  function () {
                                        const 
                                            task = askForPromise ()
                                            , lastArgument = [...arguments].slice(-1)[0]
                                            ;
                                        expect ( lastArgument ).to.be.equal ( 'tt1' ) // result of previous function was added to arguments
                                        // WARNING: "arguments" is available only in function declaration, not in arrow function.
                                        setTimeout ( () => {
                                                        turn.push ( 2 )
                                                        task.done ( 'tt2' )
                                                }, 50 )
                                        return task.promise
                                }
                    , t3 = () => {
                                        const task = askForPromise();
                                        turn.push ( 3 )
                                        task.done ( 'tt3' )
                                        return task.promise
                                }
                    , list = [ t1, t2, t3 ]
                    ;
                // sequence of async functions: 
                // Next function will start when previous function is done.
                const task = askForPromise.sequence ( list, 'h1' )
                task.onComplete ( r => {
                            expect ( turn ).to.be.deep.equal ( [1,2,3] )            // in order of completion
                            expect ( r ).to.be.deep.equal ( ['tt1', 'tt2', 'tt3'] ) // in order of declaration
                            done ()
                    })
        }) // it sequence sample



    it ( 'All promises in parallel', done => {
                const
                      turn = []
                    , t1 = function () {
                                        const 
                                            task = askForPromise ()
                                            , lastArgument = [...arguments].slice(-1)[0]
                                            ;
                                        
                                        expect ( lastArgument ).to.be.equal ( 'h1' )
                                        setTimeout ( () => {
                                                        turn.push ( 1 )
                                                        task.done ( 'tt1' )
                                                }, 120 )
                                        return task.promise
                                }
                    // WARNING: "arguments" is available only in function declaration. 
                    // Do not use arrow function if you want to use arguments.
                    , t2 =  function () {
                                        const 
                                            task = askForPromise ()
                                            , lastArgument = [...arguments].slice(-1)[0]
                                            ;
                                        expect ( lastArgument ).to.be.equal ( 'h1' )
                                        setTimeout ( () => {
                                                        turn.push ( 2 )
                                                        task.done ( 'tt2' )
                                                }, 80 )
                                        return task.promise
                                }
                    , t3 = () => {
                                        const task = askForPromise();
                                        turn.push ( 3 )
                                        task.done ( 'tt3' )
                                        return task.promise
                                }
                    , list = [ t1, t2, t3 ]
                    ;
                const task = askForPromise.all ( list, 'h1' )
                task.onComplete ( r => {
                                expect ( r ).to.be.deep.equal ( ['tt1', 'tt2', 'tt3'] ) // in order of declaration
                                expect ( turn ).to.be.deep.equal ( [3,2,1] )            // in order of completion 
                                done ()
                        })
        }) // it all promises in parallel



}) // describe