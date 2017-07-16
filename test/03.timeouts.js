'use strict'

var 
      askForPromise = require ('../askForPromise')
    , chai = require ( 'chai' )
    , expect = chai.expect
    ;





describe ( 'askForPromise - "Timeout" function', done => {
    
    it ( 'Timeout: Single Promise with completion', ( done ) => {
            const task = askForPromise ().timeout ( 100, "timeout" )
            task.done ( 'standard' )
            task.onComplete ( ( r ) => { 
                        expect ( r ).to.be.equal ( 'standard', 'Function should close the promise.' )
                        done ()
                   })
       }) // it single with completion



    it ( 'Timeout: Single Promise with timeout', done => {
            const task = askForPromise (). timeout ( 20, 'expire' )
            setTimeout ( () => task.done('task'), 40 )
            task.onComplete ( r => {
                  expect ( r ).to.be.equal ( 'expire', 'Timeout should close the promise' )
                  done ()
              })
       }) // it single with timeout



    it ( 'Timeout: Multiple promises with completion', done => {
            const list = [ 2, 50, 10, 40 ];
            const task = askForPromise ( list ).timeout ( 100, "finish" )
            list.forEach ( ( el, i ) => { setTimeout ( () => task[i].done ( el ), el )   })
            task
             .onComplete ( ( r ) => {
                                        expect ( r ).to.be.an.array
                                        expect ( r ).to.have.length ( 4 )
                                        done ()
                 })
        }) // it multiple with completion



    it ( 'Timeout: Multipe promises with timeout', done => {
      const list = [ 2, 60, 10, 40 ];
      const task = askForPromise ( list ).timeout ( 40, "finish" )
            list.forEach ( (el,i) => setTimeout ( () => task[i].done(el), el )   )
            task
             .onComplete ( ( r ) => {                                        
                                        expect ( r ).to.be.equal ('finish', 'Timeout should be applied' )
                                        done ()
                 })
       }) // it multipe with timeout

}) // describe





