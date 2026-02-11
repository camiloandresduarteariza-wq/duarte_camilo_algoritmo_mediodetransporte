// =====================
// 1) DATOS
// =====================

const transportes = [
  "Avión",
  "Tren",
  "Autobús",
  "Barco",
  "Auto",
  "Bicicleta"
];

const segmentos = {
  "P": "Bajo presupuesto",
  "N": "Viaje de negocios",
  "M": "Mochilero",
  "E": "Viajero ecológico",
  "F": "Viaje familiar"
};

const contextos = {
  "R": "¿Cuál es más rápido?",
  "C": "¿Cuál es más económico?",
  "S": "¿Cuál es más sostenible?",
  "X": "¿Cuál ofrece mejor experiencia?"
};

// Elo
const RATING_INICIAL = 1000;
const K = 32;

const STORAGE_KEY = "travelmash_state_v1";

// =====================
// 2) ESTADO
// =====================

function defaultState(){
  const buckets = {};
  for (const seg in segmentos){
    for (const ctx in contextos){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      transportes.forEach(t => buckets[key][t] = RATING_INICIAL);
    }
  }
  return { buckets };
}

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// =====================
// 3) ELO
// =====================

function expectedScore(a,b){
  return 1 / (1 + Math.pow(10, (b - a)/400));
}

function updateElo(bucket, A, B, winner){
  const ra = bucket[A];
  const rb = bucket[B];

  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  bucket[A] = ra + K * ((winner === "A" ? 1 : 0) - ea);
  bucket[B] = rb + K * ((winner === "B" ? 1 : 0) - eb);
}

// =====================
// 4) UTILIDADES
// =====================

function randomPair(){
  const a = transportes[Math.floor(Math.random()*transportes.length)];
  let b = a;
  while(b === a){
    b = transportes[Math.floor(Math.random()*transportes.length)];
  }
  return [a,b];
}

function bucketKey(seg,ctx){
  return `${seg}__${ctx}`;
}

function topN(bucket){
  return Object.entries(bucket)
    .map(([t,r]) => ({t,r}))
    .sort((a,b)=>b.r - a.r)
    .slice(0,10);
}

// =====================
// 5) UI
// =====================

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const questionEl = document.getElementById("question");
const topBox = document.getElementById("topBox");

let currentA, currentB;

function fillSelect(el,obj){
  el.innerHTML="";
  for(const k in obj){
    const opt=document.createElement("option");
    opt.value=k;
    opt.textContent=obj[k];
    el.appendChild(opt);
  }
}

fillSelect(segmentSelect,segmentos);
fillSelect(contextSelect,contextos);

function newDuel(){
  [currentA,currentB]=randomPair();
  labelA.textContent=currentA;
  labelB.textContent=currentB;
  questionEl.textContent=contextos[contextSelect.value];
}

function renderTop(){
  const bucket=state.buckets[bucketKey(segmentSelect.value,contextSelect.value)];
  topBox.innerHTML=topN(bucket).map((r,i)=>`
    <div class="toprow">
      <div><b>${i+1}.</b> ${r.t}</div>
      <div>${r.r.toFixed(1)}</div>
    </div>
  `).join("");
}

function vote(winner){
  const bucket=state.buckets[bucketKey(segmentSelect.value,contextSelect.value)];
  updateElo(bucket,currentA,currentB,winner);
  saveState();
  renderTop();
  newDuel();
}

document.getElementById("btnA").onclick=()=>vote("A");
document.getElementById("btnB").onclick=()=>vote("B");
document.getElementById("btnNewPair").onclick=newDuel;
document.getElementById("btnShowTop").onclick=renderTop;
document.getElementById("btnReset").onclick=()=>{
  state=defaultState();
  saveState();
  renderTop();
  newDuel();
};

newDuel();
renderTop();
