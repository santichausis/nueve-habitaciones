const fs=require("fs");
const html=fs.readFileSync(process.argv[2],"utf8");
const js=html.slice(html.indexOf("<script>")+8, html.lastIndexOf("</script>"));
// DOM mínimo para que el juego arranque
const mk=()=>({style:{setProperty(){},}, classList:{toggle(){},add(){},remove(){}}, dataset:{}, setAttribute(){}, addEventListener(){},
  appendChild(){}, querySelector:()=>mk(), querySelectorAll:()=>[], get innerHTML(){return "";}, set innerHTML(v){}, textContent:"", hidden:false, offsetWidth:0, focus(){}, tabIndex:0});
const store={};
global.localStorage={getItem:k=>k in store?store[k]:null, setItem:(k,v)=>{store[k]=String(v)}};
global.document={ querySelector:()=>mk(), querySelectorAll:()=>[], createElement:mk, createElementNS:mk,
  createDocumentFragment:mk, addEventListener(){} };
global.window=global; global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=(f)=>{};
// exponer internos para poder testear
new Function(js.replace("})();","global.__T={pickCase,Engine,LEVELS,ROOMS,NB8,coord,N,idx};})();"))();
const T=global.__T;

let fails=0, hintCounts=[];
for(const level of ["facil","normal","dificil"]){
  for(let n=0;n<40;n++){
    const P=T.pickCase(level);
    if(P.level!==level){ console.log("nivel equivocado"); fails++; }
    // jugar el caso entero usando SÓLO el motor de pistas
    const e=new T.Engine(P.region); e.elim(P.body,-1);
    let hints=0;
    while(e.count<9 && e.ok && hints<300){ if(!e.step(T.LEVELS.dificil)) break; hints++; }
    if(e.count!==9){ console.log(level+": las pistas no completan el caso"); fails++; continue; }
    for(const i of P.stars) if(!e.star[i]){ console.log("las pistas llevan a otra solución"); fails++; break; }
    hintCounts.push(hints);
    // el asesino revelado
    const touching=T.NB8[P.body].filter(x=>P.stars.includes(x));
    if(touching.length!==1 || P.region[touching[0]]!==P.guilty){ console.log("asesino mal"); fails++; }
    if(!T.ROOMS[P.guilty] || !T.ROOMS[P.guilty].who){ console.log("sospechoso inexistente"); fails++; }
  }
}
// la bolsa no debe repetir casos hasta agotar la dificultad
const seen=new Set(); for(let i=0;i<200;i++) seen.add(T.pickCase("facil").stars.join(","));
console.log("120 casos jugados de punta a punta con el motor de pistas");
console.log("pasos de deducción por caso — mín",Math.min(...hintCounts),"mediana",hintCounts.sort((a,b)=>a-b)[60],"máx",Math.max(...hintCounts));
console.log("200 extracciones seguidas de 'fácil' →",seen.size,"casos distintos (de 200)");
console.log(fails===0 ? "\n✅ 0 fallos" : "\n❌ fallos: "+fails);
