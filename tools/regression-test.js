const fs=require("fs");
const html=fs.readFileSync(process.argv[2],"utf8");
const js=html.slice(html.indexOf("<script>")+8, html.lastIndexOf("</script>"));
let alertText="";
const mk=(id)=>({style:{setProperty(){}}, classList:{_s:new Set(),toggle(c,v){v?this._s.add(c):this._s.delete(c)},add(c){this._s.add(c)},remove(c){this._s.delete(c)}},
  dataset:{}, setAttribute(){}, addEventListener(){}, appendChild(){}, querySelector:()=>mk(), querySelectorAll:()=>[],
  set innerHTML(v){}, get innerHTML(){return""},
  set textContent(v){ if(this.__id==="#alert") alertText=v; }, get textContent(){return""},
  hidden:false, offsetWidth:0, focus(){}, tabIndex:0, __id:id});
const nodes={};
const store={};
global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)}};
global.document={ querySelector:(sel)=>nodes[sel]||(nodes[sel]=mk(sel)), querySelectorAll:()=>[],
  createElement:()=>mk(), createElementNS:()=>mk(), createDocumentFragment:()=>mk(), addEventListener(){} };
global.window=global; global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=()=>{};
new Function(js.replace("})();","global.__T={decodeCase,analyze,render,famLabel,marks:()=>marks,setP:(p)=>{P=p},setMarks:(m)=>{marks=m},PERSON,CROSS,EMPTY,autoCross,N,idx,coord};})();"))();
const T=global.__T;

// el caso exacto de la captura
const line=fs.readFileSync(process.argv[3],"utf8").split("\n").find(l=>{
  const c=l.split(" ")[1]; if(!c) return false;
  const reg=[...c.slice(0,81)].map(x=>+x);
  return parseInt(c.slice(90,92),10)===47 && reg[64]===reg[65] && reg.filter(g=>g===reg[64]).length===2;
});
const P=T.decodeCase(line.split(" ")[1], line.split(" ")[0]);
T.setP(P);

function fresh(){ const m=new Array(81).fill(T.EMPTY); T.setMarks(m); return m; }
const D8=7*9+3, C8=7*9+2;

// 1) jugada incorrecta: persona en D8 (lo que pasó en la captura)
let m=fresh(); m[D8]=T.PERSON; T.autoCross(D8,[]);
alertText=""; T.render();
console.log("1) persona en D8  → aviso:", alertText || "(NINGUNO ❌)");

// 2) jugada correcta: persona en C8
m=fresh(); m[C8]=T.PERSON; T.autoCross(C8,[]);
alertText=""; T.render();
console.log("2) persona en C8  → aviso:", alertText || "(ninguno ✅)");

// 3) tablero vacío: no debe avisar nada
fresh(); alertText=""; T.render();
console.log("3) tablero vacío  → aviso:", alertText || "(ninguno ✅)");

// 4) dos personas que se tocan
m=fresh(); m[0]=T.PERSON; m[10]=T.PERSON;
alertText=""; T.render();
console.log("4) A1 y B2 juntas → aviso:", alertText || "(NINGUNO ❌)");

// 5) la solución completa no debe disparar ningún aviso
m=fresh(); P.stars.forEach(i=>{ m[i]=T.PERSON; });
alertText=""; T.render();
console.log("5) solución entera → aviso:", alertText || "(ninguno ✅)");
