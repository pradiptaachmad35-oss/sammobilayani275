const sb=window.supabase.createClient(window.SAM_CONFIG.SUPABASE_URL,window.SAM_CONFIG.SUPABASE_ANON_KEY);
let cars=[];
let pickedPhotos=[];
const loginView=document.getElementById('loginView');
const adminView=document.getElementById('adminView');
const loginForm=document.getElementById('loginForm');
const loginError=document.getElementById('loginError');
const carForm=document.getElementById('carForm');
const drawer=document.getElementById('drawer');
const photoInput=document.getElementById('photoInput');
const dropZone=document.getElementById('dropZone');
const photoPreview=document.getElementById('photoPreview');

const showError=(msg)=>{loginError.textContent=msg||'';};

function showAdmin(){
  loginView.classList.add('hidden');
  adminView.classList.remove('hidden');
  loadCars();
}

function showLogin(){
  adminView.classList.add('hidden');
  loginView.classList.remove('hidden');
}

async function loadCars(){
  const {data,error}=await sb.from('cars').select('*').order('created_at',{ascending:false});
  if(error){
    console.error(error);
    document.getElementById('adminRows').innerHTML='<tr><td colspan="5" style="text-align:center;padding:50px;color:#b42318">Gagal mengambil data mobil.</td></tr>';
    return;
  }
  cars=data||[];
  renderRows();
}

function renderRows(){
  const rows=document.getElementById('adminRows');
  rows.innerHTML=cars.length?cars.map(c=>`<tr>
    <td><div class="unit"><img src="${c.photos?.[0]||'sam-storefront.jpeg'}"><div><strong>${escapeHtml(c.name)}</strong><br><small>${escapeHtml(c.brand)} • ${escapeHtml(c.model||'')}</small></div></div></td>
    <td>${c.year||'—'}</td>
    <td>Rp ${Number(c.price||0).toLocaleString('id-ID')}</td>
    <td><span class="pill ${c.status!=='Tersedia'?'sold':''}">${escapeHtml(c.status)}</span></td>
    <td class="actions"><button onclick="editCar('${c.id}')">Edit</button><button onclick="deleteCar('${c.id}')">Hapus</button></td>
  </tr>`).join(''):`<tr><td colspan="5" style="text-align:center;padding:50px;color:#667085">Belum ada mobil. Klik "+ Tambah Mobil" untuk menambahkan unit.</td></tr>`;
}

function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function clearPicked(){
  pickedPhotos.forEach(p=>{if(p.file&&p.preview)URL.revokeObjectURL(p.preview);});
  pickedPhotos=[];
  renderPhotoPreview();
}

function openDrawer(car){
  drawer.classList.remove('hidden');
  carForm.reset();
  clearPicked();
  document.getElementById('carId').value=car?.id||'';
  document.getElementById('formTitle').textContent=car?'Edit Mobil':'Tambah Mobil';
  if(car){
    ['brand','name','model','year','km','price','status','transmission','color','description'].forEach(k=>document.getElementById(k).value=car[k]??'');
    (car.photos||[]).slice(0,10).forEach(url=>pickedPhotos.push({url,existing:true}));
    renderPhotoPreview();
  }
}

function renderPhotoPreview(){
  photoPreview.innerHTML=pickedPhotos.map((p,i)=>`<div class="photo-item">
    <img src="${p.preview||p.url}" alt="Foto ${i+1}">
    ${i===0?'<span class="main-tag">UTAMA</span>':''}
    <button type="button" onclick="removePhoto(${i})" aria-label="Hapus foto">×</button>
  </div>`).join('');
}

window.removePhoto=(index)=>{
  const item=pickedPhotos[index];
  if(item?.file&&item.preview)URL.revokeObjectURL(item.preview);
  pickedPhotos.splice(index,1);
  renderPhotoPreview();
};

function addFiles(fileList){
  const files=Array.from(fileList||[]).filter(f=>/^image\/(jpeg|png|webp)$/i.test(f.type));
  const room=10-pickedPhotos.length;
  files.slice(0,Math.max(0,room)).forEach(file=>{
    pickedPhotos.push({file,preview:URL.createObjectURL(file),existing:false});
  });
  renderPhotoPreview();
  if(files.length>room)alert('Maksimal 10 foto per mobil.');
}

photoInput.addEventListener('change',e=>{
  addFiles(e.target.files);
  photoInput.value='';
});

dropZone.addEventListener('click',e=>{
  if(e.target.id!=='choosePhotos')photoInput.click();
});
['dragenter','dragover'].forEach(evt=>dropZone.addEventListener(evt,e=>{
  e.preventDefault();
  dropZone.classList.add('dragover');
}));
['dragleave','drop'].forEach(evt=>dropZone.addEventListener(evt,e=>{
  e.preventDefault();
  dropZone.classList.remove('dragover');
}));
dropZone.addEventListener('drop',e=>addFiles(e.dataTransfer.files));

async function uploadPhotos(carId){
  const urls=[];
  for(const item of pickedPhotos){
    if(item.existing){
      urls.push(item.url);
      continue;
    }
    const ext=(item.file.name.split('.').pop()||'jpg').toLowerCase();
    const path=`${carId}/${crypto.randomUUID()}.${ext}`;
    const {error}=await sb.storage.from('car-photos').upload(path,item.file,{cacheControl:'31536000',upsert:false,contentType:item.file.type});
    if(error)throw error;
    const {data}=sb.storage.from('car-photos').getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

loginForm.onsubmit=async e=>{
  e.preventDefault();
  showError('Memproses login...');
  const username=document.getElementById('username').value.trim();
  const password=document.getElementById('password').value;
  if(username!=='admin'){
    showError('Username atau password salah.');
    return;
  }
  const {error}=await sb.auth.signInWithPassword({email:'admin@sammobilayani275.local',password});
  if(error){
    console.error(error);
    showError('Username atau password salah.');
    return;
  }
  showError('');
  showAdmin();
};

document.getElementById('logoutBtn').onclick=async()=>{
  await sb.auth.signOut();
  showLogin();
};

document.getElementById('addBtn').onclick=()=>openDrawer();
document.getElementById('drawerClose').onclick=()=>drawer.classList.add('hidden');

carForm.onsubmit=async e=>{
  e.preventDefault();
  const saveButton=carForm.querySelector('.save');
  saveButton.disabled=true;
  saveButton.textContent='Menyimpan...';
  try{
    const id=document.getElementById('carId').value||crypto.randomUUID();
    const payload={
      id,
      brand:document.getElementById('brand').value.trim(),
      name:document.getElementById('name').value.trim(),
      model:document.getElementById('model').value.trim(),
      year:Number(document.getElementById('year').value)||null,
      km:document.getElementById('km').value.trim(),
      price:Number(document.getElementById('price').value)||0,
      status:document.getElementById('status').value,
      transmission:document.getElementById('transmission').value.trim(),
      color:document.getElementById('color').value.trim(),
      condition:'Bekas',
      description:document.getElementById('description').value.trim()
    };
    payload.photos=await uploadPhotos(id);
    const {error}=await sb.from('cars').upsert(payload);
    if(error)throw error;
    drawer.classList.add('hidden');
    await loadCars();
    alert('Mobil berhasil disimpan.');
  }catch(error){
    console.error(error);
    alert('Gagal menyimpan mobil: '+(error.message||'Terjadi kesalahan.'));
  }finally{
    saveButton.disabled=false;
    saveButton.textContent='Simpan Mobil';
  }
};

window.editCar=id=>openDrawer(cars.find(c=>c.id===id));

window.deleteCar=async id=>{
  const car=cars.find(c=>c.id===id);
  if(!car||!confirm('Hapus unit ini dari katalog?'))return;
  const {error}=await sb.from('cars').delete().eq('id',id);
  if(error){
    alert('Gagal menghapus: '+error.message);
    return;
  }
  await loadCars();
};

(async()=>{
  const {data}=await sb.auth.getSession();
  if(data.session)showAdmin();
  else showLogin();
})();