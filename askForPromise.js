'use strict'
/*
	askForPromise Description
	========================
   Returns object with promise and resolve function.

*/

function askForPromise () {
   let done
   let cancel
   let x = new Promise ( (resolve, reject ) => { 
   													done   = resolve
   													cancel = reject
   											  })
   
   return { 
   			  promise : x
   			, done    : done 
   			, cancel  : cancel
   		  }
 } // startPromise func.



module.exports = askForPromise

