class s{rawBuffer=[];powerResults=[];initCalled=!1;constructor(s,e,t,r){this.frameSamples=s*e,this.numFrames=t,this.onPowerCallback=r}init(s){if(!this.initCalled)for(let e=0;e<s;e++)this.powerResults[e]=[];this.initCalled=!0}appendData(s){this.init(s.length);let t=Array(s.length);s.forEach(((s,r)=>{this.rawBuffer[r]||(this.rawBuffer[r]=new e(this.frameSamples));const o=this.rawBuffer[r].push(s).map((s=>function(s){let e=0;for(const t of s)e+=t*t;return e/s.length}(s)));t[r]=o}));for(const s of t)console.assert(s.length===t[0].length);for(let s=0;s<t[0].length;s++){for(let e=0;e<t.length;e++){const r=t[e][s];this.powerResults[e].unshift(r),this.powerResults[e].length>=this.numFrames&&(this.powerResults[e]=this.powerResults[e].slice(0,this.numFrames))}this.onPowerCallback(this.powerResults)}}}class e{workingIndex=0;constructor(s){this.buffer=new Float32Array(s)}push(s){let e=[];for(const t of s)this.workingIndex>=this.buffer.length&&(e.push(this.buffer.slice()),this.workingIndex=0),this.buffer[this.workingIndex]=t,this.workingIndex++;return e}}class t extends AudioWorkletProcessor{constructor(){super(),console.debug("LoudnessFrame100msProcessor created");this.processor=new s(sampleRate,.1,1,(s=>{const e=s.map((s=>s[0])),t=s.map((s=>1));this.postMessage({powers:e,weights:t})}))}process(s,e,t){return this.processor.appendData(s[0]),!0}postMessage(s){this.port.postMessage(s)}}registerProcessor("loudness-frame-100ms-processor",t);
//# sourceMappingURL=ebu-r128-100ms.worker.87b30ad8.js.map