'use strict'
/*
   askForPromise Description
   ========================
   Returns object with promise and resolve function.

*/



module.exports = askForPromise



function askForPromise ( list ) {
   let 
        done
      , cancel
      ;
   
   if ( list )  return  _manyPromises ( list )

   let x = new Promise ( (resolve, reject ) => { 
                                                  done   = resolve
                                                  cancel = reject
                                 })

   return { 
               promise    : x
             , done       : done 
             , cancel     : cancel
             , onComplete : _afterOne(x)
           }
 } // askForPromise func.



 function _afterOne ( x ) {
                               return function (fx ) {
                                                          x.then ( res => fx (res)   )
                                         }
    }


 
 function _afterMany ( list ) {
                              return function ( fx ) {
                                       Promise.all( list ).then ( res => fx (res)   )
                                        }
    }



 function _manyPromises ( list ) {
                                    let askObject = list.map ( el => askForPromise() )
                                    let askList   = askObject.map ( o => o.promise )
                                    
                                    askObject [ 'promises'   ] = askList
                                    askObject [ 'onComplete' ] = _afterMany ( askList )
                                    return askObject
   } 




