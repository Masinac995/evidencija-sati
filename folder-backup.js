(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.FolderBackupStore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const DB_NAME='masinac-evidencija-podesavanja',STORE='folderi',KEY='mesecne-kopije';
  const supported=()=>typeof root.showDirectoryPicker==='function'&&typeof root.indexedDB!=='undefined';
  function openDb(){return new Promise((resolve,reject)=>{const request=root.indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
  async function getHandle(){if(!supported())return null;const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(KEY);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error)})}
  async function setHandle(handle){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(handle,KEY);tx.oncomplete=()=>resolve(handle);tx.onerror=()=>reject(tx.error)})}
  async function chooseFolder(){if(!supported())throw new Error('Ovaj pregledač ne podržava direktno čuvanje u izabrani folder. Koristite Chrome ili Edge.');const handle=await root.showDirectoryPicker({id:'masinac-radni-sati',mode:'readwrite'});await setHandle(handle);return handle}
  async function writableHandle(ask=false){const handle=await getHandle();if(!handle)return null;let permission=await handle.queryPermission({mode:'readwrite'});if(permission!=='granted'&&ask)permission=await handle.requestPermission({mode:'readwrite'});return permission==='granted'?handle:null}
  async function configuredName(){const handle=await getHandle();return handle?.name||null}
  async function save(month,filename,content){
    let handle=await writableHandle(true);if(!handle)handle=await chooseFolder();
    const year=month.slice(0,4),number=month.slice(5,7),label=root.MonthlyHours.monthLabel(month).replace(/\s+\d{4}\.?$/,'').replace(/[^\p{L}\p{N} -]/gu,'').trim();
    const yearDir=await handle.getDirectoryHandle(year,{create:true}),monthDir=await yearDir.getDirectoryHandle(`${number} - ${label}`,{create:true}),file=await monthDir.getFileHandle(filename,{create:true}),writer=await file.createWritable();
    await writer.write(content);await writer.close();return `${handle.name}\\${year}\\${number} - ${label}\\${filename}`;
  }
  async function saveLatest(filename,content){
    const handle=await writableHandle(false);if(!handle)return null;const directory=await handle.getDirectoryHandle('AUTOMATSKE-KOPIJE',{create:true}),file=await directory.getFileHandle(filename,{create:true}),writer=await file.createWritable();await writer.write(content);await writer.close();return `${handle.name}\\AUTOMATSKE-KOPIJE\\${filename}`;
  }
  return {supported,chooseFolder,configuredName,save,saveLatest};
});
