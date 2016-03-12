'use strict'

var 
      askForPromise = require ('../askForPromise')
    , chai = require ( 'chai' )
    , expect = chai.expect
    ;



describe ( 'askForPromise - simplified promises', () => {
    
    it ( 'done', ( done ) => {
              var test, msg ;

              let taskComplete = askForPromise()

              setTimeout ( () => taskComplete.done ( 'success' ),   1 )

              taskComplete.promise
              .then ( ( r ) => { 
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





    it ( 'cancel' , ( done ) => {
            var test, msg;

            let taskComplete = askForPromise()

            setTimeout ( () => taskComplete.cancel('bad'),   1)

            taskComplete.promise
            .then (   (   ) => test = 1
                    , ( r ) => {
                                  test = 3
                                  msg  = r
                                } 
                  )
            test = 2

            setTimeout ( () => { 
                                  expect ( test ).to.be.equal ( 3 )
                                  expect ( msg ).to.be.equal ( 'bad' )
                                  done()
                       }, 3 )
       }) // it cancel




    
    it ( 'promise.all' , ( done ) => {
            var
                  list = [ 2, 5, 1, 4 ]
                , res  = []
                ;

            let taskComplete         = list.map ( el => askForPromise() )
            let taskCompletePromises = taskComplete.map ( o => o.promise )

            list.forEach ( ( el, i ) => {
                                    setTimeout ( () => {
                                                          res.push ( el )
                                                          taskComplete[i].done ( el )
                                       }, el )
                 })

            Promise.all ( taskCompletePromises )
            .then ( ( r ) => {
                              expect ( res ).to.have.length ( 4 )
                              expect ( r   ).to.have.length ( 4 )
                              
                              expect ( r[0]).to.equal (list[0] )
                              expect ( res[0]).to.not.equal (list[0] )

                              done()
                  })
       }) // it promise all





  it ( 'promise.race', ( done ) => {
          var
                  list = [ 2, 5, 1, 4 ]
                , res  = []
                ;

            let taskComplete         = list.map ( el => askForPromise() )
            let taskCompletePromises = taskComplete.map ( o => o.promise )

            list.forEach ( ( el, i ) => setTimeout ( () => {
                                                              res.push(el)
                                                              taskComplete[i].done ( el )
                                            } , el )   
                    )

            Promise.race ( taskCompletePromises )
            .then ( ( r ) => {
                              expect ( res ).to.have.length ( 1 )
                              expect ( r   ).to.be.equal ( res[0] )
                              done()
                  })
    }) // it race





  it ( 'alternative promise race', ( done ) => {
          var
                  list = [ 2, 5, 1, 4 ]
                , res  = []
                ;

            let taskComplete = askForPromise ()

            list.forEach ( ( el, i ) => setTimeout ( () => {
                                                              res.push(el)
                                                              taskComplete.done ( el )
                                            } , el )   
                    )

            taskComplete.promise
            .then ( ( r ) => {
                              expect ( res ).to.have.length ( 1 )
                              expect ( r   ).to.be.equal ( res[0] )
                              done()
                  })
    }) // it alt race

   



  it ( 'chain of promises' , ( done ) => {
            var result = [];

            let step1 = askForPromise()
            let step2 = askForPromise()
            let step3 = askForPromise()

            step1.done()
            
            step1.promise
            .then ( () => {
                              result.push ( 'step 1' )
                              setTimeout ( () => step2.done(), 1)
                              return step2.promise
                  })
            .then ( () => {
                              result.push ( 'step 2' )
                              setTimeout ( () => step3.done(), 1)
                              return step3.promise
                  })
            .then ( () => {
                             result.push ( 'step 3' )
                             expect ( result    ).to.have.length ( 4 )
                             expect ( result[0] ).to.equal ( 'start' )
                             done()
                  })

            result.push ( 'start' )
     }) // it chain



}) // describe



