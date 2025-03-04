'use strict'

import askForPromise from '../src/askForPromise.js'
import { expect } from 'chai';



describe ( 'askForPromise - general', () => {
    
    it ( 'done (resolve)', () => {
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
                         }, 3 )
       }) // it done





    it ( 'cancel (reject)' , () => {
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
                       }, 3 )
       }) // it cancel




    
    it ( 'promise.all' , () => {
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
                  })
       }) // it promise all





  it ( 'promise.race', () => {
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
                  })
    }) // it race





  it ( 'Alternative promise race', () => {
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
            .then ( r => {
                              expect ( res ).to.have.length ( 1 )
                              expect ( r   ).to.be.equal ( res[0] )                              
                  })
    }) // it alt race

   



  it ( 'Chain of promises' , () => {
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
                  })

            result.push ( 'start' )
     }) // it chain



  it ( 'Array of promises' , () => {
         let 
                 list = [ 1 , 2, 3 ]
               , a = 1
               ;

         let mission = askForPromise ( list )

         list.forEach ( (el,i) => {
                                     a = el
                                     mission.done(i)
              })
         
         Promise
           .all ( mission.promises )
           .then ( () => {
                            expect ( a ).to.be.equal ( 3 )                            
                      })
  }) // it array of promises



it ( 'Array of promises' , () => {
        let 
                 list = [ 1 , 2, 3 ]
               , a = 1
               ;
        let mission = askForPromise ( list )

         mission.each ( ({value, done},i) => {
                                                a = value
                                                done(i)
                                        })
         
         mission.onComplete  ( res => {
                        expect ( a ).to.be.equal ( 3 )
                        expect ( res ).to.have.length ( 3 )
                        expect ( res[0] ).to.be.deep.equal ( [0, 1, 2] )
                })
           
    }) // it array of promises

}) // describe



