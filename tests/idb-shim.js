/* Minimal in-process IndexedDB. Enough that db.js runs its real code paths,
   including transaction lifetime, which is where a real bug once hid. */
function makeShim() {
  const dbs = {};
  const tick = fn => queueMicrotask(fn);
  function Req(){ this.onsuccess=null; this.onerror=null; this.result=undefined; this.error=null; }
  function fire(r,v){ r.result=v; tick(()=>r.onsuccess&&r.onsuccess({target:r})); }
  function Store(map){ this.map=map; }
  Store.prototype.get=function(k){const r=new Req();fire(r,this.map[k]);return r;};
  Store.prototype.put=function(v,k){this.map[k]=JSON.parse(JSON.stringify(v));const r=new Req();fire(r,k);return r;};
  Store.prototype.delete=function(k){delete this.map[k];const r=new Req();fire(r,undefined);return r;};
  Store.prototype.clear=function(){Object.keys(this.map).forEach(k=>delete this.map[k]);const r=new Req();fire(r,undefined);return r;};
  Store.prototype.getAll=function(){const r=new Req();fire(r,Object.keys(this.map).map(k=>this.map[k]));return r;};
  Store.prototype.getAllKeys=function(){const r=new Req();fire(r,Object.keys(this.map));return r;};
  Store.prototype.createIndex=function(){};
  Object.defineProperty(Store.prototype,'indexNames',{get(){return{contains:()=>true};}});
  function Tx(db){ this.db=db; this.active=true; this.oncomplete=null; this.onabort=null; this.error=null;
    tick(()=>{ this.active=false; tick(()=>this.oncomplete&&this.oncomplete()); }); }
  Tx.prototype.objectStore=function(n){ if(!this.active){const e=new Error('TransactionInactiveError');e.name='TransactionInactiveError';throw e;}
    return new Store(this.db.stores[n]); };
  function DB(name){ this.name=name; this.stores={}; this.objectStoreNames={contains:n=>n in this.stores}; }
  DB.prototype.transaction=function(){ return new Tx(this); };
  DB.prototype.createObjectStore=function(n){ this.stores[n]={}; return new Store(this.stores[n]); };
  return { open(name){ const req=new Req(); const fresh=!dbs[name];
      const db=dbs[name]||(dbs[name]=new DB(name));
      tick(()=>{ if(fresh&&req.onupgradeneeded){ const tx=new Tx(db); tx.active=true;
          tx.objectStore=n=>new Store(db.stores[n]||(db.stores[n]={}));
          req.onupgradeneeded({target:{result:db,transaction:tx}}); }
        fire(req,db); });
      return req; } };
}
module.exports = { makeShim };
