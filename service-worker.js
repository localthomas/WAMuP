if(!self.define){let e,i={};const r=(r,a)=>(r=new URL(r+".js",a).href,i[r]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=r,e.onload=i,document.head.appendChild(e)}else e=r,importScripts(r),i()})).then((()=>{let e=i[r];if(!e)throw new Error(`Module ${r} didn’t register its module`);return e})));self.define=(a,s)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(i[c])return;let n={};const f=e=>r(e,c),d={module:{uri:c},exports:n,require:f};i[c]=Promise.all(a.map((e=>d[e]||f(e)))).then((e=>(s(...e),n)))}}define(["./workbox-c493a740"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"default-image.57d2154c.png",revision:"44027ff3b00a29ac2e055ed117eb865c"},{url:"ebu-r128.worker.4a24ad14.js",revision:"e932a82c595ced66ffd8021babc17c3e"},{url:"ebu-r128.worker.4a24ad14.js.map",revision:"4347b10dbad6e069388c9b12a9dee723"},{url:"favicon.cc2d0e54.svg",revision:"bf1681eb731363b09204784a80a61093"},{url:"file-handling.worker.8953294b.js",revision:"4b5e5570ba231a81e525975cfc3da11b"},{url:"file-handling.worker.8953294b.js.map",revision:"1d0ea2897f6ff975883d1467751e3860"},{url:"icon_x192.c5914f2f.png",revision:"1f246ed6bf3f44a01ea52eded2d65d95"},{url:"index.3f87ee1b.css",revision:"f13bd996cbefd8fc87ebada5898d8c04"},{url:"index.3f87ee1b.css.map",revision:"a57085c2d2a8b29695b006073caed064"},{url:"index.ba6b3e07.js",revision:"045e928ed3a9eca649896d03914499ed"},{url:"index.ba6b3e07.js.map",revision:"de89b5cbbe6b62c432b9920c4bee474f"},{url:"index.html",revision:"2619b3f2491a9e9c7f96a03833256125"},{url:"licenses.ba044a42.js",revision:"3ec62f65a763b314eac2681e38f3bfa9"},{url:"licenses.ba044a42.js.map",revision:"e703993cb549d9e89696f3438b2a34cf"},{url:"loudness.worker.afa5c855.js",revision:"748690258b7fc729a194178ae98fe2ad"},{url:"loudness.worker.afa5c855.js.map",revision:"48e520aeeeac0c03b558f330f4786a1f"},{url:"manifest.webmanifest",revision:"fce3a3893ce6116ac2e25df5aacb0aca"}],{}),e.registerRoute(/.*/,new e.CacheOnly,"GET")}));
//# sourceMappingURL=service-worker.js.map