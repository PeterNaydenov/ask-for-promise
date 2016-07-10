'use strict'

var 
      askForPromise = require ('../askForPromise')
    , chai = require ( 'chai' )
    , expect = chai.expect
    ;



describe ( 'askForPromise - "onComplete" function', () => {
    
    it ( 'onComplete: One promise', ( done ) => {
              var test, msg ;

              let task = askForPromise ()

              setTimeout ( () => task.done ( 'success' ),   1 )

              
              task
                .onComplete ( ( r ) => { 
                                          test = 1
                                          msg = r
                   })
              
              test = 2

              setTimeout ( () => {
                                         expect ( test ).to.be.equal ( 1 )
                                         expect ( msg  ).to.be.equal ( 'success' )
                                         done()
                         }, 3 )
       }) // it done
    




    it ( 'onComplete: List of promises', ( done ) => {
                 var
                  list = [ 2, 5, 1, 4 ]
                , res  = []
                ;

            let task = askForPromise ( list )

            list.forEach ( ( el, i ) => {
                                           setTimeout ( () => {
                                                                  res.push ( el )
                                                                  task[i].done ( el )
                                              }, el )
                 })

            task
             .onComplete ( ( r ) => {
                                        expect ( res ).to.have.length ( 4 )
                                        expect ( r   ).to.have.length ( 4 )
                                        
                                        expect ( r[0]).to.equal (list[0] )
                                        expect ( res[0]).to.not.equal (list[0] )

                                        done ()
                 })
       }) // it done


  


    it ( 'onComplete: Alternative promise race', ( done ) => {
          var
                  list = [ 2, 5, 1, 4 ]
                , res  = []
                ;

            let task = askForPromise ()

            list.forEach ( ( el, i ) => setTimeout ( () => {
                                                              res.push(el)
                                                              task.done ( el )
                                              } , el )   
                    )

            task.onComplete ( ( r ) => {
                                            expect ( res ).to.have.length ( 1 )
                                            expect ( r   ).to.be.equal ( res[0] )
                                            done()
                    })
    }) // it alt race

 
  
}) // describe





