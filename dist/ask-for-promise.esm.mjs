function e(e){return e?function(e){let i=e.map((e=>n())),r=i.map((e=>e.promise));i.promises=i;let c=t(Promise.all(r));function u(e){let n="pending";return e.then((()=>n="fulfilled")).catch((()=>n="rejected")),n}function l(n,...t){i.forEach(((o,i)=>n({value:e[i],done:o.done,cancel:o.cancel,timeout:o.timeout,state:u(o.promise)},...t)))}const m={promise:Promise.all(r),promises:i,done:e=>{i.forEach((n=>n.done(e)))},cancel:e=>{i.forEach((n=>n.cancel(e)))},each:l,onComplete:c,timeout:()=>{}};return m.timeout=o(!0,m),m}(e):n()}function n(){let e,n;const i=new Promise(((t,o)=>{e=t,n=o})),r={promise:i,promises:null,done:e,cancel:n,each:()=>{},onComplete:t(i),timeout:()=>{}};return r.timeout=o(!1,r),r.each=(t,...o)=>{t({value:null,done:e,cancel:n,timeout:r.timeout},...o)},r}function t(e){return function(n,t=null){null===t?e.then((e=>n(e))):e.then((e=>n(e)),(e=>t(e)))}}function o(e,n){let o;return o=e?Promise.all(n.promises.map((e=>e.promise))):n.promise,function(e,i){let r,c=new Promise(((n,t)=>{r=setTimeout((()=>{n(i),Promise.resolve(o)}),e)}));return o.then((()=>clearTimeout(r))),n.onComplete=t(Promise.race([o,c])),n}}e.sequence=function(n,...t){const o=e(),i=[];const r=function*(e){for(const n of e)yield n}(n);return function e(n,...t){n.done?o.done(i):n.value(...t).then((n=>{i.push(n),e(r.next(),...t,n)}))}(r.next(),...t),o},e.all=function(n,...t){const o=e(),i=[],r=n.map(((e,n)=>"function"==typeof e?e(...t).then((e=>i[n]=e)):e.then((e=>i[n]=e))));return Promise.all(r).then((()=>o.done(i))),o};export{e as default};
