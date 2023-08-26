'use strict'

var 
      askForPromise = require ('../src/askForPromise')
    , chai = require ( 'chai' )
    , expect = chai.expect
    ;



describe ( 'askForPromise - "onComplete" function', () => {
    
    it ( 'onComplete: One promise', () => {
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
                         }, 3 )
       }) // it done
    




    it ( 'onComplete: List of promises', () => {
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
             .onComplete ( r => {
                                        expect ( res ).to.have.length ( 4 )
                                        expect ( r   ).to.have.length ( 4 )
                                        
                                        expect ( r[0]).to.equal (list[0] )
                                        expect ( res[0]).to.not.equal (list[0] )
                 })
       }) // it done



    it ( 'onComplete: Empty list of promises', done => {
            const list = [];
            let task = askForPromise (list);
            list.forEach ( ( el, i ) =>  task[i].done(el)   )
            task
                .onComplete ( r => {
                                      expect ( r ).to.have.length ( 0 )
                                      done ()
                          })
      }) // it empty list



    it ( 'onComplete: Alternative promise race', () => {
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

            task.onComplete ( r => {
                                        expect ( res ).to.have.length ( 1 )
                                        expect ( r   ).to.be.equal ( 1 )
                    })
    }) // it alt race
  
}) // describe





