'use strict'
/*
   askForPromise Description
   ========================
   Returns object with the promise and related helper functions.
   - Created March 12th, 2016;
   - Promise with timeout added July 16th, 2017 (v.1.3.0);
   - askForPromise.all & AskForPromise.sequence added October 15th, 2023(v.1.4.0);
   - jsDocs type definitions added October 27th, 2023(v.1.5.0);
   - Converted to ES6 module January 6th, 2024(v.2.0.0);
   - Massive refactoring of the library. Method 'each' added December 18th, 2024(v.3.0.0);
*/



/**
 * @interface AskObject
 * @description Object with promise and related helper functions
 * @property {Promise} promise - Promise object
 * @property {Array<AskObject>|null} [promises] - Array of promises if multiple promises are created
 * @property {Function} done - Resolve function
 * @property {Function} cancel - Reject function
 * @property {Function} each - Callback function to be called for each list item
 * @property {Function} onComplete - Function to be called after promise is resolved
 * @property {Function} timeout - Function to set timeout on promise
 */



/**
 * Creates object with promise and related helper functions
 * @function askForPromise
 * @param {Array<any>} [list] - List of items that need to have a corresponding promise.(optional)
 * @returns {AskObject} Object with promise and related helper functions
 */
function askForPromise ( list ) {
        if ( list ) return _manyPromises ( list )
        else        return _singlePromise ();
 } // askForPromise func.



/**
 * @function sequence
 * @description Executes list of functions that return a promise in sequence.
 * @param {Array<Function>} list - List of functions that return a promise
 * @param {...any} args - Arguments to be passed to each function in the list
 * @returns {AskObject} - Object with promise and related helper functions
 */
 askForPromise.sequence = function promiseInSequence ( list, ...args ) {
  const 
        task = askForPromise ()
      , result = []
      ;

  function* listGen ( n ) {   for ( const el of n ) { yield el }} 
  const g = listGen ( list );

  function wait ( n, ...args ) {   // Recursive function for calling function list in sequence
      if ( n.done ) {
               task.done ( result )
               return
          }
      n.value (...args).then ( r => {
              result.push ( r )
              wait( g.next(), ...args, r )
          }) 
      } // wait func.

  wait ( g.next(), ...args ) // Starting with iteration of list
  return task
} // promiseInSequence func.



/**
 * @function all
 * @description Executes list of functions that return a promise in parallel.
 * @param {Array<Function>} list - List of functions that return a promise
 * @param {...any} args - Arguments to be passed to each function in the list
 * @returns {AskObject} - Object with promise and related helper functions
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





/**
 * Creates a single promise with helper functions.
 * @function _singlePromise Creates a single promise
 * @returns {AskObject} Object containing the promise and related helper functions such as:
 * - promise: The promise itself
 * - done: Function to resolve the promise
 * - cancel: Function to reject the promise
 * - each: Function to iterate over a single promise (no-op for a single promise)
 * - onComplete: Function to be called after the promise is resolved
 * - timeout: Function to set a timeout on the promise
 */
function _singlePromise () {
  let  done, cancel;
  const x = new Promise ( (resolve, reject ) => { 
                                                  done   = resolve
                                                  cancel = reject
                                 })
    /** @type {AskObject} */
    const askObject = {
               promise    : x
             , promises   : null
             , done       
             , cancel     
             , each       : () => {}
             , onComplete : _after(x)
             , timeout    : () => {}
           }

    askObject.timeout = _timeout ( false, askObject )
    askObject.each = (cbFn, ...args) => { cbFn({value: null, done: done, cancel: cancel, timeout: askObject.timeout}, ...args) }
    
    return askObject
   } // _singlePromise func.



/**
 * Creates an object with multiple promises and related helper functions.
 * @param {Array<any>} list - List of items that need to have a corresponding promise.
 * @returns {AskObject} Object containing the promises and related helper functions such as:
 * - promise: It's equal to Promise.all (list of promises)
 * - promises: An array of single promise objects
 * - done: Function to resolve all promises
 * - cancel: Function to reject all promises
 * - each: Function to iterate over the promises and call a callback function for each promise
 * - onComplete: Function to be called after all promises are resolved
 * - timeout: Function to set a timeout on all promises
 */
 function _manyPromises ( list ) {
                                    let listOfPromiseObjects = list.map ( el => _singlePromise() )
                                    let listOfPromises   = listOfPromiseObjects.map ( o => o.promise )
                                    
                                    listOfPromiseObjects [ 'promises' ] = listOfPromiseObjects
                                    let onComplete = _after ( Promise.all (listOfPromises) )



                                  /**
                                   * Reads the state of a promise
                                   * @function readPromiseState
                                   * @description Returns the state of the promise as string: 'pending', 'fulfilled', or 'rejected'
                                   * @param {Promise} promise - The promise to read the state of
                                   * @returns {string} The state of the promise as string
                                   */
                                    function readPromiseState ( promise ) {
                                            let state = 'pending';
                                            promise.then ( () => state = 'fulfilled' )
                                                    .catch ( () => state = 'rejected' )
                                            return state
                                      } // readPromiseState func.
                                   


                                  /**
                                   * Iterates over the promises and calls the callback function for each.
                                   * Callback function will receive an object with the following properties:
                                   * - value: the value associated with the promise
                                   * - done: the promise resolve function
                                   * - cancel: the promise reject function
                                   * - timeout: a function that sets the timeout on the promise
                                   * @param {function} cbFn - callback function to be called for each promise
                                   * @param {...any} args - additional arguments to be passed to the callback function
                                   */
                                    function each ( cbFn, ...args ) {
                                            listOfPromiseObjects.forEach ( (prom,i) => cbFn ({
                                                                                            value:list[i], 
                                                                                            done: prom.done, 
                                                                                            cancel: prom.cancel, 
                                                                                            timeout: prom.timeout, 
                                                                                            state: readPromiseState(prom.promise) 
                                                                                        }, 
                                                                                        ...args
                                                                                      ))
                                      } // each func.



                                     /** @type {AskObject} */
                                     const askObject = {
                                                  promise    : Promise.all ( listOfPromises )
                                                , promises   : listOfPromiseObjects
                                                , done       : ( response )  => { listOfPromiseObjects.forEach ( o => o.done( response  ) )}
                                                , cancel     : ( response )  => { listOfPromiseObjects.forEach ( o => o.cancel( response ) )}
                                                , each
                                                , onComplete : onComplete
                                                , timeout    : () => {}
                                            }
                                    askObject.timeout = _timeout ( true, askObject )
                                    return askObject
   } // _manyPromises func.



/**
 * Creates a function that will be called after promise is resolved
 * @param {Promise} x - The promise
 * @returns {Function} Function to be called after promise is resolved
 */
function _after ( x ) {
/**
 * @function onComplete
 * @description Function to be called after promise is resolved
 * @param {Function} fx - Function to be called after promise is resolved
 * @param {Function|null} [rejectFx] - Optional. Function to be called if promise is rejected
 * @returns {void} - Nothing
 */
return function onComplete ( fx, rejectFx=null ) {
                if ( rejectFx === null ) x.then ( res => fx(res) )
                else                     x.then ( res => fx(res) , res => rejectFx(res)  )
}} // _after func.



/**
 * Creates a timeout function for the given promise(s) in the AskObject.
 * If `isList` is true, the timeout is applied to the collection of promises,
 * otherwise it is applied to a single promise.
 * 
 * When the timeout duration (`ttl`) is reached before the promise(s) resolve,
 * the provided expiration message (`expMsg`) is returned.
 * 
 * @param {boolean} isList - Flag indicating if the AskObject contains multiple promises.
 * @param {AskObject} askObject - The AskObject containing the promise(s) to apply the timeout to.
 * @returns {Function} - A function that sets a timeout on the promise(s) and updates the AskObject.
 */

function _timeout ( isList, askObject ) {
      let main;
      
      if ( isList ) main = Promise.all( askObject.promises.map ( o => o.promise ) );
      else          main = askObject.promise;

      /**
       * @function timeout
       * @description Sets timeout on promise
       * @param {number} ttl - Timeout in milliseconds
       * @param {string|number} expMsg - Message to be returned if timeout occurs
       * @returns {AskObject} - Object with promise and related helper functions
       */
      return function timeout( ttl, expMsg ) {
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



export default askForPromise


