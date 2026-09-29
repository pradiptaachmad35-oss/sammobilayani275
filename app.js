const brands=['Toyota','Mitsubishi','Honda','Daihatsu','Isuzu','Suzuki','Lainnya'];
const brandLogos={Toyota:'toyota.png',Mitsubishi:'Mitsubishi.png',Honda:'honda.png',Daihatsu:'Daihatsu.png',Isuzu:'Isuzu.png',Suzuki:'suzuku.png'};
let cars=[],activeBrand='Semua',activeCar=null,photoIndex=0;
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const normalizeBrand=v=>String(v??'').trim().toLowerCase();
const brandGrid=document.getElementById('brandGrid'),catalog=document.getElementById('catalog'),empty=document.getElementById('emptyState');

function renderBrands(){
  brandGrid.innerHTML=brands.map(b=>{
    const logo=brandLogos[b];
    return '<button class="brand-chip '+(activeBrand===b?'selected':'')+'" data-brand="'+b+'"><div class="brand-logo">'+(logo?'<img src="'+logo+'" alt="'+b+'">':'<span class="other-car">🚘</span>')+'</div><div class="brand-name">'+b+'</div></button>';
  }).join('');
  document.querySelectorAll('.brand-chip').forEach(btn=>btn.addEventListener('click',()=>setBrand(btn.dataset.brand)));
}
function renderCars(){
  const list=activeBrand==='Semua'?cars:cars.filter(c=>normalizeBrand(c.brand)===normalizeBrand(activeBrand));
  catalog.innerHTML=list.map(c=>{
    const photo=(c.photos&&c.photos[0])||'sam-storefront.jpeg';
    const sold=c.status!=='Tersedia';
    return '<article class="car-card"><div class="car-image"><img src="'+photo+'" alt="'+c.name+'" loading="lazy"><span class="status '+(sold?'sold':'')+'"><i></i>'+(sold?'Stok Habis':'Tersedia')+'</span></div><div class="car-info"><h3>'+c.name+'</h3><div class="car-model">'+(c.model||'')+'</div><div class="specs"><span>▣ '+(c.year||'—')+'</span><span>◷ '+(c.km||'—')+'</span></div><div class="price-row"><div class="price">'+rupiah(c.price)+'</div>'+(c.nego?'<span class="nego-badge">Nego</span>':'')+'</div><button class="card-btn '+(sold?'disabled':'')+'" data-id="'+c.id+'">'+(sold?'Stok Habis':'Lihat Detail →')+'</button></div></article>';
  }).join('');
  empty.classList.toggle('hidden',list.length>0);
  document.querySelectorAll('.card-btn:not(.disabled)').forEach(btn=>btn.addEventListener('click',()=>openDetail(btn.dataset.id)));
}
function setBrand(brand){activeBrand=brand;renderBrands();renderCars();document.getElementById('stok').scrollIntoView({behavior:'smooth',block:'start'});}
function openDetail(id){activeCar=cars.find(c=>c.id===id);photoIndex=0;updateModal();document.getElementById('detailModal').classList.remove('hidden');document.body.style.overflow='hidden';}
function updateModal(){
  if(!activeCar)return;
  const photos=activeCar.photos&&activeCar.photos.length?activeCar.photos:['sam-storefront.jpeg'];
  document.getElementById('detailImage').src=photos[photoIndex];
  document.getElementById('photoDots').textContent=photos.length>1?(photoIndex+1)+' / '+photos.length:'';
  const sold=activeCar.status!=='Tersedia';
  document.getElementById('detailBody').innerHTML='<span class="status detail-status '+(sold?'sold':'')+'"><i></i>'+(sold?'Stok Habis':'Unit Tersedia')+'</span><h2>'+activeCar.name+'</h2><div>'+(activeCar.model||'')+'</div><div class="detail-price-row"><div class="detail-price">'+rupiah(activeCar.price)+'</div>'+(activeCar.nego?'<span class="nego-badge detail-nego">Nego</span>':'')+'</div><div class="detail-specs"><div class="spec-item"><span>📅 Tahun</span><strong>'+ (activeCar.year||'—') +'</strong></div><div class="spec-item"><span>🛣️ Kilometer</span><strong>'+ (activeCar.km||'—') +'</strong></div><div class="spec-item"><span>⚙️ Transmisi</span><strong>'+ (String(activeCar.transmission||"—").toLowerCase()==="otomatis" ? "Automatic" : (activeCar.transmission||"—")) +'</strong></div><div class="spec-item"><span>⛽ Bahan Bakar</span><strong>'+ (activeCar.fuel||"—") +'</strong></div><div class="spec-item"><span>🎨 Warna</span><strong>'+ (activeCar.color||'—') +'</strong></div><div class="spec-item"><span>🚗 Kondisi</span><strong>'+(activeCar.condition||'Bekas')+'</strong></div><div class="spec-item"><span>📍 Lokasi</span><strong>Surabaya</strong></div></div><div class="detail-info-box"><div class="detail-info-title">✨ Tertarik dengan unit ini?</div><p>Dapatkan informasi lebih lengkap mengenai kondisi kendaraan, kelengkapan surat, dan detail unit langsung dari SAM MOBIL.</p></div>'+(sold?'':'<a class="wa-btn" href="https://wa.me/'+window.SAM_CONFIG.WHATSAPP_DEFAULT+'?text='+encodeURIComponent('Halo, saya tertarik dengan '+activeCar.name+' '+(activeCar.model||'')+' tahun '+activeCar.year+'. Apakah unit tersebut masih tersedia?')+'" target="_blank" rel="noopener">WhatsApp — Tanyakan Unit</a>');
  document.getElementById('prevPhoto').style.display=photos.length>1?'':'none';
  document.getElementById('nextPhoto').style.display=photos.length>1?'':'none';
}
async function loadCars(){
  try{
    const client=window.supabase.createClient(window.SAM_CONFIG.SUPABASE_URL,window.SAM_CONFIG.SUPABASE_ANON_KEY);
    const {data,error}=await client.from('cars').select('*').order('created_at',{ascending:false});
    if(error)throw error;
    cars=data||[];
  }catch(error){
    console.error('Gagal mengambil katalog Supabase:',error);
    cars=[];
  }
  renderBrands();renderCars();
}
document.getElementById('clearFilter').addEventListener('click',()=>setBrand('Semua'));
document.getElementById('heroStockBtn').addEventListener('click',e=>{e.preventDefault();setBrand('Semua');});
document.getElementById('modalClose').addEventListener('click',()=>{document.getElementById('detailModal').classList.add('hidden');document.body.style.overflow='';});
document.getElementById('detailModal').addEventListener('click',e=>{if(e.target.id==='detailModal')document.getElementById('modalClose').click();});
document.getElementById('prevPhoto').addEventListener('click',()=>{if(activeCar){const n=activeCar.photos?.length||1;photoIndex=(photoIndex-1+n)%n;updateModal();}});
document.getElementById('nextPhoto').addEventListener('click',()=>{if(activeCar){const n=activeCar.photos?.length||1;photoIndex=(photoIndex+1)%n;updateModal();}});
let touchStart=0;
document.getElementById('detailImage').addEventListener('touchstart',e=>{touchStart=e.changedTouches[0].clientX;});
document.getElementById('detailImage').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStart;if(Math.abs(dx)>40)(dx<0?document.getElementById('nextPhoto'):document.getElementById('prevPhoto')).click();});
loadCars();
/* Homepage hero slideshow */
const heroSlides=[...document.querySelectorAll('.hero-slide')];
const heroDots=[...document.querySelectorAll('.hero-dots .dot')];
let heroIndex=0;
function showHeroSlide(i){
  if(!heroSlides.length)return;
  heroIndex=(i+heroSlides.length)%heroSlides.length;
  heroSlides.forEach((el,n)=>el.classList.toggle('active',n===heroIndex));
  heroDots.forEach((el,n)=>el.classList.toggle('active',n===heroIndex));
}
if(heroSlides.length>1){
  setInterval(()=>showHeroSlide(heroIndex+1),5000);
  heroDots.forEach((dot,i)=>dot.addEventListener('click',()=>showHeroSlide(i)));
}
