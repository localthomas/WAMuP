if(!self.define){let e,i={};const a=(a,r)=>(a=new URL(a+".js",r).href,i[a]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=a,e.onload=i,document.head.appendChild(e)}else e=a,importScripts(a),i()})).then((()=>{let e=i[a];if(!e)throw new Error(`Module ${a} didn’t register its module`);return e})));self.define=(r,c)=>{const s=e||("document"in self?document.currentScript.src:"")||location.href;if(i[s])return;let n={};const d=e=>a(e,s),f={module:{uri:s},exports:n,require:d};i[s]=Promise.all(r.map((e=>f[e]||d(e)))).then((e=>(c(...e),n)))}}define(["./workbox-c493a740"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"default-image.57d2154c.png",revision:"44027ff3b00a29ac2e055ed117eb865c"},{url:"ebu-r128.worker.a3e242da.js",revision:"73b231c81928eaea20682ac13a8290e4"},{url:"ebu-r128.worker.a3e242da.js.map",revision:"b29af7aa3b24449d970e021b573d0775"},{url:"favicon.cc2d0e54.svg",revision:"bf1681eb731363b09204784a80a61093"},{url:"file-handling.worker.fe132dfe.js",revision:"21531f263ac74487c949126cc850c370"},{url:"file-handling.worker.fe132dfe.js.map",revision:"126b6e9da3f235f44c881ad934ed0f9a"},{url:"icon_x192.c5914f2f.png",revision:"1f246ed6bf3f44a01ea52eded2d65d95"},{url:"index.4063c02b.js",revision:"f944340c02a458089e132251418008cb"},{url:"index.4063c02b.js.map",revision:"58bb3ce71e0b203dd54cbdc7cd21ffd5"},{url:"index.88a44a91.css",revision:"cacad8c5d5586541de8f7bd6e41c82b5"},{url:"index.88a44a91.css.map",revision:"0a7b4c8d147658fd41fbb433a05531a6"},{url:"index.html",revision:"dc792aeb68748bd099fd76f6ce59aa87"},{url:"licenses.9c666056.js",revision:"cf28890993aaa0685b6e2c255a9e4590"},{url:"licenses.9c666056.js.map",revision:"9e7954a07701fe9df3d696468790823e"},{url:"loudness.worker.afa5c855.js",revision:"748690258b7fc729a194178ae98fe2ad"},{url:"loudness.worker.afa5c855.js.map",revision:"2c287885ee6285c4ac1a9c7e5c997737"},{url:"manifest.webmanifest",revision:"fce3a3893ce6116ac2e25df5aacb0aca"}],{}),e.registerRoute(/.*/,new e.CacheOnly,"GET")}));
//# sourceMappingURL=service-worker.js.map
