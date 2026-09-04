const fs=require("fs");
const html=fs.readFileSync(process.argv[2],"utf8");
const src=html.slice(html.indexOf("const N = 9;"), html.indexOf("/* ---------- estado ---------- */"));
eval(src.replace(/^(const|let) /gm,"var "));   // aporta Engine, LEVELS, nb4, NB8

// contador de soluciones propio del test, sin compartir código con el juego
function cuentaSoluciones(region, tope){
  let n=0; const uc=Array(9).fill(false), ur=Array(9).fill(false);
  (function rec(r,prev){
    if(n>=tope) return;
    if(r===9){ n++; return; }
    for(let c=0;c<9;c++){
      if(uc[c]) continue;
      if(prev>=0 && Math.abs(c-prev)<=1) continue;
      const g=region[r*9+c]; if(ur[g]) continue;
      uc[c]=true; ur[g]=true; rec(r+1,c); uc[c]=false; ur[g]=false;
      if(n>=tope) return;
    }
  })(0,-1);
  return n;
}
const lines=fs.readFileSync(process.argv[3],"utf8").split("\n").filter(Boolean);
const buckets={facil:[],normal:[],dificil:[]};
let bad=0, reasons={};
const fail=r=>{bad++; reasons[r]=(reasons[r]||0)+1;};

for(const line of lines){
  const [level,code]=line.split(" ");
  if(!code||code.length!==92){ fail("formato"); continue; }
  const region=new Int8Array(81);
  for(let i=0;i<81;i++) region[i]=code.charCodeAt(i)-48;
  const stars=[]; for(let r=0;r<9;r++) stars.push(r*9+(code.charCodeAt(81+r)-48));
  const body=parseInt(code.slice(90,92),10), ss=new Set(stars);
  if(new Set(stars.map(i=>i%9)).size!==9){ fail("columnas"); continue; }
  if(new Set(stars.map(i=>region[i])).size!==9){ fail("habitaciones"); continue; }
  if(stars.some(i=>NB8[i].some(x=>ss.has(x)))){ fail("se tocan"); continue; }
  let ok=true;
  for(let g=0;g<9 && ok;g++){
    const cells=[]; for(let i=0;i<81;i++) if(region[i]===g) cells.push(i);
    if(cells.length<2){ ok=false; fail("habitación de 1"); break; }
    const seen=new Set([cells[0]]), q=[cells[0]];
    while(q.length){const c=q.pop(); for(const x of nb4(c)) if(region[x]===g&&!seen.has(x)){seen.add(x);q.push(x);}}
    if(seen.size!==cells.length){ ok=false; fail("habitación partida"); }
  }
  if(!ok) continue;
  if(cuentaSoluciones(region,3)!==1){ fail("no única"); continue; }
  // resoluble SIN usar el dato del cuerpo (que ahora está oculto)
  const e=new Engine(region);
  if(!e.run(LEVELS[level])){ fail("no resoluble sin adivinar"); continue; }
  if(!stars.every(i=>e.star[i])){ fail("otra solución"); continue; }
  const min=["facil","normal","dificil"].find(l=>new Engine(region).run(LEVELS[l]));
  if(min!==level){ fail("nivel mal etiquetado"); continue; }
  if(ss.has(body)){ fail("cuerpo sobre persona"); continue; }
  if(NB8[body].filter(x=>ss.has(x)).length!==1){ fail("asesino ambiguo"); continue; }
  buckets[level].push(code);
}
for(const k in buckets){
  const b=buckets[k];
  for(let i=b.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;const t=b[i];b[i]=b[j];b[j]=t;}
}
console.log("rechazados:",bad, bad?reasons:"");
console.log("aceptados:",Object.fromEntries(Object.entries(buckets).map(([k,v])=>[k,v.length])));
fs.writeFileSync(process.argv[4], JSON.stringify(buckets));
