# Ask for Promise

![version](https://img.shields.io/github/package-json/v/peterNaydenov/ask-for-promise)
![license](https://img.shields.io/github/license/peterNaydenov/ask-for-promise)



Decouple **promises** from their 'resolve' and 'reject' functions and make posible to use them with any javascript function ( sync or async). 'Ask-for-promise' also provide sugar syntax for some long statements.

'Ask-for-promise' provides also an option to set a **ttl ( time to live) for the promise**. If time is up promise will close with timeout message.

```js

// standard promise pattern
let standardTask = new Promire ( (resolve,reject) => {
       // ... wrap everything related to the promise inside this function
       // when promise resolve - call resolve (result)
       // or call reject ( result )
    })

// after promise:
standardTask.then ( item => {
  // where 'item' is a 'result' argument sent from 'resolve' or 'reject' function. 
})



// askForPromise pattern
let askTask = askForPromise()
/* 
  askTask is an object that contains
  {
     promise    - Promise itself
     done       - function : Resolve function
     cancel     - function : Reject function
     onComplete - function : Sugar synax for askTask.promise.then
  }

  You can complete the promise anywhere in your code by writing:
  askTask.done(result)

  Or reject promise by:
  askTask.cancel(result)
*/

// after promise:
askTask.onComplete ( item => { 
// where 'item' is a 'result' argument sent from 'done' or 'cancel' function. 
})

```




## Installation

Install by writing in your terminal:

```
npm install ask-for-promise --save

```

Once it has been installed, it can be used by writing this line of JavaScript:

```js
var askForPromise = require('ask-for-promise')

```




## Examples

### Simple promise

```js
let task = askForPromise()

asyncFunction ( someArgument, ( err, r ) => task.done ( 'task complete' )   )

task.onComplete ( r => console.log(r)   )

// Method 'onComplete' is sugar syntax for 'task.promise.then'.
// task.promise.then ( r => { console.log ( r ) })
```

AskForPromise will return an object. Property `task.promise` will contain promise it self. Resolve function is available as `task.done` and reject function as `task.cancel`. Completion of asyncFunction will complete the promise with 'task complete' argument and will print a console message 'task complete'.

### Let's do a Promise.race without using `Promise.race`.
```js
let task = askForPromise()

async_1 ( arg, ( err, r) => task.done('1') )
async_2 ( arg, ( err, r) => task.done('2') )

task.onComplete ( r => console.log(r)   )
// It's equal of:
// task.promise.than ( r => console.log ( r )   )
```
It's almost the same as previous example - right?

### Long Promise Chain
Let's see how looks long chain of promises:
```js

// Keep definition of all promises together.
let prepareFolders  = askForPromise()
let writeFiles      = askForPromise()
let updateInterface = askForPromise()

// myFS is a dummy library that works with files.
myFS.makeFolders ( folders, ( err , r ) => prepareFolders.done() )

prepareFolders
 .onComplete ( () => {
                  myFS.writeFiles ( files , () => writeFiles.done() )
                  return writeFiles.promise
              })
.then ( () => {
                 updateInterface ()  // if it's not async.
                 updateInterface.done()
                 return updateInterface.promise
   })
.then ( () => {
                 console.log('DONE')
   })

```




### Promise with Timeout

```js
let final;
const task = askForPromise().timeout ( 2000, 'expire' );
// setTimeout: .timeout ( ttl, 'expireMessage'). ttl is time to live in milliseconds

task.onComplete ( result => {
    if ( result === 'expire' ) final = 'timeout'                    // ... it's after timeout
    else                       final = 'success resolved promise'
})

```





### Promise All

Promise all by providing array of data. Here is the example:
```js

  const files = [ 'info.txt', 'general.txt', 'about.txt' ]

  let writeFile = askForPromise ( files )

  files.forEach ( (file,i) => {
          fs.writeFile ( file,'dummy text', () => writeFile[i].done() )
       })

writeFile.onComplete ( () => console.log ( 'DONE' )   )
  

/*
Last statement is equivalent of:
Promise
   .all ( writeFile.promises )
   .then ( () => console.log ( 'DONE' )   )
*/

```

When function askForPromise get argument will return array of askForPromises object and property 'promises' will contain array of all promises.





### Control of single promise and many promises
With 'ask-for-promise' asking for one or many promises have almost same syntax. There is some code sample to illustrate this:
```js

  // ask for single promise
     let singlePromise = askForPromise ()

 // ask for list of promises
    let listOfItems = [ 'first', 'second', 'third' ]
    let manyPromises = askForPromise ( listOfItems )

 /* 
     manyPromises statement is short version of this:
     let temp  = listOfItems.map ( item => askForPromise ()   )
     let manyPromises = temp.map ( o => o.promise )
 */


 // Promise complete for single promise
    singlePromise.onComplete ( (r) => { console.log (r)   })

 // All promises for the array are completed.
    manyPromises.onComplete ( (r) => { console.log (r)   })

```





### More
For more examples please visit test folder of the project.





## Known bugs
_(Nothing yet)_





## External Links
- [History of changes](https://github.com/PeterNaydenov/ask-for-promise/blob/master/Changelog.md)



## Credits
'ask-for-promise' was created by Peter Naydenov.




## License
'ask-for-promise' is released under the [MIT License](http://opensource.org/licenses/MIT).