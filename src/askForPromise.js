'use strict'
/*
   askForPromise Description
   ========================
   Returns object with the promise and related helper functions.
   - Created March 12th, 2016;
   - Promise with timeout added July 16th, 2017 (v.1.3.0);
   - askForPromise.all & AskForPromise.sequence added October 15th, 2023(v.1.4.0);
   - jsDocs type definitions added October 27th, 2023(v.1.5.0);
*/

module.exports = askForPromise



/**
 * @typedef askObject
 * @type {Object}
 * @description Object with promise and related helper functions
 * @property {Promise} [promise] - Promise object if a single promise is created
 * @property {Array<Promise>} [promises] - Array of promises if multiple promises are created
 * @property {Function} done - Resolve function
 * @property {Function} cancel - Reject function
 * @property {Function} onComplete - Function to be called after promise is resolved
 * @property {Function} timeout - Function to set timeout on promise
 * 
 */


/**
 * @function askForPromise
 * @param {Array<any>} [list] - List of items that need to have a corresponding promise.(optional)
 * @returns {askObject} - Object with promise and related helper functions
 */
function askForPromise ( list ) {
   let  
         isList = false
       , askObject
       ;
   
   if ( list ) {
                askObject = _manyPromises ( list )
                isList = true
        } 
   else         askObject = _singlePromise ();

   askObject.timeout = _timeout ( isList, askObject )   
   return askObject
 } // askForPromise func.




/**
 * @function sequence
 * @description Executes list of functions that return a promise in sequence.
 * @param {Array<Function>} list - List of functions that return a promise
 * @param {...any} args - Arguments to be passed to each function in the list
 * @returns {askObject} - Object with promise and related helper functions
 */
 askForPromise.sequence = function promiseInSequence ( list, ...args ) {
  const 
        task = askForPromise ()
      , result = []
      ;

  function* listGen ( n ) {   for ( const el of n ) { yield el }} 
  const g = listGen ( list );

  function wait ( n, ...args ) {
      if ( n.done ) {
               task.done ( result )
               return
          }
      n.value (...args).then ( r => {
              result.push ( r )
              wait( g.next(), ...args, r )
          }) 
      } // wait func.

  wait ( g.next(), ...args )
  return task
} // promiseInSequence func.




/**
 * @function all
 * @description Executes list of functions that return a promise in parallel.
 * @param {Array<Function>} list - List of functions that return a promise
 * @param {...any} args - Arguments to be passed to each function in the list
 * @returns {askObject} - Object with promise and related helper functions
 */
askForPromise.all = function promiseAll ( list, ...args ) {
  const 
        task = askForPromise ()
      , result = []
      , r = list.map ( (n,i) => { 
                            return (typeof n === 'function') ? n(...args).then ( r => result[i] = r   ) 
                                                             : n.then ( r => result[i] = r   )
                        })
      ;
  Promise.all ( r ).then ( () => task.done(result)   )
  return task
} // promiseAll func.





function _singlePromise () {
  let  done, cancel;
  const x = new Promise ( (resolve, reject ) => { 
                                                  done   = resolve
                                                  cancel = reject
                                 })

   return { 
               promise    : x
             , done       : done 
             , cancel     : cancel
             , onComplete : _after(x)
           }
   } // _singlePromise func.



 function _manyPromises ( list ) {
                                    let askObject = list.map ( el => _singlePromise() )
                                    let askList   = askObject.map ( o => o.promise )
                                    
                                    askObject [ 'promises'   ] = askList
                                    askObject [ 'onComplete' ] = _after ( Promise.all (askList) )
                                    return askObject
   } // _manyPromises func.



function _after (x) {
/**
 * @function onComplete
 * @description Function to be called after promise is resolved
 * @param {Function} fx - Function to be called after promise is resolved
 * @returns {void} - Nothing
 */
return function onComplete ( fx ) {
                x.then ( res => fx(res)   )
}}



function _timeout ( isList, askObject ) {
      let main;
      
      if ( isList ) main = Promise.all( askObject.promises );
      else          main = askObject.promise;

      /**
       * @function timeout
       * @description Sets timeout on promise
       * @param {number} ttl - Timeout in milliseconds
       * @param {string|number} expMsg - Message to be returned if timeout occurs
       * @returns {askObject} - Object with promise and related helper functions
       */
      return function ( ttl, expMsg ) {
                let timer;
                let timeout = new Promise ( (resolve, reject) => {
                                        timer = setTimeout ( () => {
                                                        resolve ( expMsg )
                                                        Promise.resolve ( main )
                                                    }, ttl)
                                    }); // timeout
                main.then ( () => clearTimeout(timer)   )                
                askObject [ 'onComplete'] = _after ( Promise.race ([main, timeout])   )
                return askObject
            }
    } // _timeout func.

