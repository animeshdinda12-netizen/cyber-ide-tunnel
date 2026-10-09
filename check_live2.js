const https = require("https");
const https2 = require("https");
function get(u){return new Promise((res,rej)=>{https.get(u,{timeout:30000},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res({status:r.statusCode,body:d}));}).on("error",rej);});}
(async()=>{
  try{
    const r = await get("https://animeshdinda12-netizen.github.io/cyber-ide-tunnel/index.html");
    const body = r.body;
    console.log("status:", r.status, "bytes:", body.length);
    console.log("ends with root mount:", body.includes('React.createElement(App)'));
    console.log("has body tag open:", body.includes("<body"));
    console.log("has html tag open:", body.includes("<html"));
    console.log("has closing </html>:", body.includes("</html>"));
    console.log("last 300 chars:", JSON.stringify(body.slice(-300)));
    console.log("first 200 chars:", JSON.stringify(body.slice(0,200)));
    // check if there's a meta http-equiv refresh or js redirect
    console.log("has refresh:", /http-equiv=["']refresh/i.test(body));
  }catch(e){console.error(e.message);}
})();
