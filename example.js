'use strict'

var askForPromise = require ('./askForPromise');



 let 
       wait_3s = askForPromise()
     , wait_5s = askForPromise()
     , just_go = askForPromise()
     ;

 console.log('Start')
 
 // Promise is decoupled of functions resolve and reject. 
 setTimeout ( () => wait_3s.done(), 3000 )
 
 // Promise chain
 wait_3s.promise
 .then (      () => {
                   console.log('After 3 seconds. Count to 5')
                   setTimeout ( () => wait_5s.done(), 5000 )
                   // Always return promise if you want to continue with the chain
                   return wait_5s.promise
              })
 .then (      () => {
                   console.log ( "After 5 seconds. Let's finish with that" )
                   just_go.done ( 'Step forward' )
                   return just_go.promise
              })
 .then ( ( data ) => {
                   console.log ( data + ' and FINAL' )
            })



