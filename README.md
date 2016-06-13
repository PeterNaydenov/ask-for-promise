# Ask for Promise

Decouple **promises** from their 'resolve' and 'reject' functions and make posible to use them with any standard javascript function. 





## Installation

Install by writing in your terminal:

```
npm install ask-for-promise --save-dev

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

task.promise
.then ( ( r ) => { console.log ( r ) })

```

AskForPromise will return an object. Property `task.promise` will contain promise it self. Resolve function is available as `task.done` and reject function as `task.cancel`. Completion of asyncFunction will complete the promise and will send in the console message 'task complete'.

### Let's do a Promise.race without using `Promise.race`.
```js
let task = askForPromise()

async_1 ( arg, ( err, r) => task.done('1') )
async_2 ( arg, ( err, r) => task.done('2') )

task.promise
.than ( ( r ) => { console.log ( r ) })

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

prepareFolders.promise
.then ( () => {
                  myFS.writeFiles ( files , ()=> writeFiles.done() )
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





### Promise All
```js
 const files = [ 'info.txt', 'general.txt', 'about.txt']

 let writeComplete = files.map ( fl => askForPromise()   )
 let writePromises = writeComplete.map ( o => o.promise ) 

 files.forEach ( ( file , i ) => {
       fs.writeFile ( file ,'dummy text', () => writeComplete[i].done() )
   })

 Promise
  .all ( writePromises )
  .then ( () => {   
                  console.log ( 'DONE' )   
          })


```

Simplify this example by providing array as argument of function askForPromise. Here is the rewrite of example:
```js

  const files = [ 'info.txt', 'general.txt', 'about.txt' ]

  let writeComplete = askForPromise ( files )

  files.forEach ( (file,i) => {
          fs.writeFile ( file,'dummy text', () => writeTask[i].done() )
       })

  Promise
   .all ( writeComplete.promises )
   .then ( () => { 
                    console.log ( 'DONE' )   
           })


```

When function askForPromise get argument will return array of askForPromises object and property 'promises' will contain array of all promises.






### More
For more examples please visit test folder of the project.





## Known bugs
_(Nothing yet)_





## Release History

### 1.1.1 (2016-06-13)

 - [x] Array as argument;
 - [x] Documentation update;
 - [x] Test case;
 - [ ] Browser version

### 1.0.0 (2016-03-12)

 - [x] Node.js module;
 - [x] Test package;
 - [x] Example file;
 - [ ] Browser version




## Credits
'ask-for-promise' was created by Peter Naydenov.




## License
'ask-for-promise' is released under the [MIT License](http://opensource.org/licenses/MIT).