const $ = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);
const CFG = window.WCFG;

// Guest name from ?to=
const params = new URLSearchParams(location.search);
let guest = params.get('to') || 'Tamu Undangan';
try{ guest = decodeURIComponent(guest.replace(/\+/g,' ')); }catch{}

const couple = `${CFG.groomName} & ${CFG.brideName}`;
$('#guestName').textContent = guest;
$('#guestInline').textContent = guest;
document.title = `Undangan ${couple}`;

// Fill static texts
$('#akadTime').textContent = CFG.akadTime;
$('#resepsiTime').textContent = CFG.resepsiTime;
$('#venue').textContent = CFG.venue;

// Date + countdown
const eventDate = new Date(CFG.eventDateISO);
$('#dateLong').textContent = eventDate.toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

const cde = $('#countdown');
function tick(){
  const now = new Date();
  const d = eventDate - now;
  if(d<=0){ cde.textContent = 'Acara telah dimulai 🎉'; return; }
  const days = Math.floor(d/864e5);
  const hours = Math.floor(d%864e5/36e5);
  const mins = Math.floor(d%36e5/6e4);
  const secs = Math.floor(d%6e4/1e3);
  cde.textContent = `${days} Hari ${hours} Jam ${mins} Menit ${secs} Detik`;
}
tick(); setInterval(tick,1000);

// Maps
$('#mapsFrame').src = CFG.gmapsUrl.replace('http://','https://');
$('#gmapsBtn').href = CFG.gmapsUrl;

// WhatsApp RSVP
const enc = encodeURIComponent;
const yesMsg = CFG.waYes.replace('{GUEST}', guest).replace('{COUPLE}', couple);
const noMsg  = CFG.waNo.replace('{GUEST}', guest).replace('{COUPLE}', couple);
$('#waYes').href = `https://wa.me/${CFG.waNumber}?text=${enc(yesMsg)}`;
$('#waNo').href  = `https://wa.me/${CFG.waNumber}?text=${enc(noMsg)}`;

// Cover open (must be user-initiated to play music)
const openBtn = $('#openBtn');
const cover = $('#cover');
const bgm = $('#bgm');
openBtn.addEventListener('click', async ()=>{
  cover.style.display='none';
  try{ await bgm.play(); }catch(e){ /* ignore autoplay block */ }
});

// Lightbox for gallery
const lb = $('#lightbox'); const lbImg = $('#lbImg'); const lbClose = $('#lbClose');
$$('.gl').forEach(img=>img.addEventListener('click',()=>{ lbImg.src = img.src; lb.classList.remove('hidden'); }));
lbClose.addEventListener('click',()=>lb.classList.add('hidden'));
lb.addEventListener('click',(e)=>{ if(e.target===lb){ lb.classList.add('hidden'); } });

// Wishes (localStorage; optional Firebase)
const list = $('#wishList');
const form = $('#wishForm');
const key = 'wishes';
function loadLocal(){
  try{ return JSON.parse(localStorage.getItem(key)||'[]'); }catch{ return []; }
}
function saveLocal(arr){ localStorage.setItem(key, JSON.stringify(arr)); }
function render(items){
  list.innerHTML='';
  items.slice().reverse().forEach(w=>{
    const li = document.createElement('li');
    li.innerHTML = `<strong>${w.name}</strong><br/><span>${w.msg}</span>`;
    list.appendChild(li);
  });
}
let wishes = loadLocal(); render(wishes);
form.addEventListener('submit',(e)=>{
  e.preventDefault();
  const name = $('#wName').value.trim();
  const msg  = $('#wMsg').value.trim();
  if(!name || !msg) return;
  const item = {name, msg, ts: Date.now()};
  wishes.push(item); saveLocal(wishes); render(wishes);
  form.reset();
});

// Firebase hook (optional)
if(CFG.firebase && CFG.firebase.enabled){
  // Lazy load firebase scripts
  const s1 = document.createElement('script');
  const s2 = document.createElement('script');
  s1.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
  s2.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js';
  s2.onload = initFb; document.head.appendChild(s1); document.head.appendChild(s2);
  function initFb(){
    const app = firebase.initializeApp(CFG.firebase);
    const db = firebase.firestore(app);
    const col = db.collection('wishes');
    // load
    col.orderBy('ts','desc').onSnapshot(snap=>{
      wishes = snap.docs.map(d=>d.data());
      render(wishes);
    });
    // submit
    form.addEventListener('submit', async (e)=>{
      if(!$('#wName').value.trim() || !$('#wMsg').value.trim()) return;
      await col.add({name: $('#wName').value.trim(), msg: $('#wMsg').value.trim(), ts: Date.now()});
    }, {once:true}); // prevent double-binding
  }
}
