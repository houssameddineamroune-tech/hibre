(function(){
  'use strict';
  const KEY = 'hibr_incubator_apps';
  function loadApps(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } }
  function saveApps(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
  function getApp(id){ const arr = loadApps(); return arr.find(a=>String(a.id)===String(id)); }

  function requestDocument(appId, docKey, requesterId, requesterName){ const arr = loadApps(); const app = arr.find(a=>String(a.id)===String(appId)); if(!app) return false; app.documents = app.documents || {}; app.documents[docKey] = { status: 'requested', requestedBy: requesterName||requesterId||null, requestedById: requesterId||null, requestedAt: Date.now() }; saveApps(arr); return true; }

  function uploadDocument(appId, docKey, fileId, uploaderId, uploaderName){ const arr = loadApps(); const app = arr.find(a=>String(a.id)===String(appId)); if(!app) return false; app.documents = app.documents || {}; app.documents[docKey] = { status: 'uploaded', fileId: fileId, uploadedBy: uploaderName||uploaderId||null, uploadedById: uploaderId||null, uploadedAt: Date.now() }; saveApps(arr); return true; }

  function getAcceptedApps(){ return loadApps().filter(a=>['accepted','incubated'].includes(String(a.status))); }

  window.Incubator = { loadApps, saveApps, getApp, requestDocument, uploadDocument, getAcceptedApps, KEY };
})();
