'use strict'

import askForPromise from '../src/askForPromise.js'
import { expect } from 'chai';



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
                , i = 0
                ;

            let task = askForPromise ( list )
            task.each ( ({value, done}) => {
                          setTimeout ( () => { 
                                            res.push ( value )
                                            done ( i )
                                            i ++
                                }, value )
                    })

            task
             .onComplete ( r => {
                                        expect ( res ).to.have.length ( 4 )
                                        expect ( r   ).to.have.length ( 4 )
                            
                                        expect ( r[0]).to.equal (list[0] )
                                        expect ( res[0]).to.not.equal (list[0] )

                                        expect ( res ).to.be.deep.equal ( list )
                                        expect ( r ).to.be.deep.equal ( [1,3,0,2] )
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
                  list = [ 20, 50, 1, 40 ]
                , res  = []
                ;

            let task = askForPromise ()

            list.forEach ( el  => setTimeout ( () => {
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





