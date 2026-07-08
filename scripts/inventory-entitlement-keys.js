/**
 * BPlen HUB - Inventario READ-ONLY das chaves de entitlement dos clientes
 * (BUG-042 / Trilha 3b - levantamento, NAO escreve nada)
 *
 * Le User/{matricula}/User_Permissions/access.services de todos os usuarios e
 * cruza cada chave com a colecao `products` (slugs/serviceCodes ativos) para
 * classificar: chave canonica, produto arquivado, ID orfao, flag inerte, etc.
 *
 * Uso: node scripts/inventory-entitlement-keys.js
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      let v = m[2] || '';
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[m[1]] = v.replace(/\\n/g, '\n');
    }
  });
}
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  })});
}
const db = admin.firestore();

// Chaves que NAO sao slug de produto — o selo e flags de capability conhecidas.
const NON_PRODUCT_KEYS = new Set([
  'member_area_access', 'hub_community', 'survey_welcome', 'content_premium',
  'career_planning', 'behavioral_analysis', 'mentoria_1to1',
]);

async function main() {
  const productsSnap = await db.collection('products').get();
  const bySlug = new Map();      // slug/id -> {status, serviceCode}
  const byServiceCode = new Map();
  productsSnap.docs.forEach(d => {
    const data = d.data();
    bySlug.set(d.id, { status: data.status, serviceCode: data.serviceCode });
    if (data.slug) bySlug.set(data.slug, { status: data.status, serviceCode: data.serviceCode });
    if (data.serviceCode) byServiceCode.set(data.serviceCode, { status: data.status, slug: data.slug });
  });

  console.log(`\n=== Produtos: ${productsSnap.size} | ATIVOS ===`);
  productsSnap.docs
    .filter(d => (d.data().status || '').toLowerCase() === 'active')
    .sort((a, b) => (a.data().order ?? 99) - (b.data().order ?? 99))
    .forEach(d => console.log(`  ${d.data().serviceCode || '?'}  ${d.id}`));

  const permsSnap = await db.collectionGroup('User_Permissions').get();
  const clients = [];
  permsSnap.forEach(doc => {
    if (doc.id !== 'access') return;
    const matricula = doc.ref.parent.parent?.id;
    const services = doc.data().services || {};
    const keys = Object.keys(services).filter(k => services[k] === true || services[k] === false);
    if (keys.length > 0) clients.push({ matricula, services });
  });

  console.log(`\n=== Clientes com entitlement (services nao-vazio): ${clients.length} ===\n`);
  const keyUsage = new Map(); // chave -> {clientes:[], classe}
  for (const c of clients) {
    console.log(`--- ${c.matricula} ---`);
    for (const [key, val] of Object.entries(c.services)) {
      let classe;
      if (key === 'member_area_access') classe = 'SELO (member_area_access)';
      else if (NON_PRODUCT_KEYS.has(key)) classe = 'FLAG capability';
      else if (bySlug.has(key)) {
        const p = bySlug.get(key);
        classe = (p.status || '').toLowerCase() === 'active' ? `PRODUTO ATIVO (${p.serviceCode})` : `PRODUTO ARQUIVADO (${p.serviceCode || '?'})`;
      } else if (byServiceCode.has(key)) classe = `serviceCode direto (${key})`;
      else if (/^[A-Za-z0-9]{20}$/.test(key)) classe = 'ID ORFAO (parece doc-id)';
      else classe = 'DESCONHECIDA (slug nao encontrado)';

      console.log(`    ${val === true ? 'true ' : 'false'}  ${key.padEnd(28)} -> ${classe}`);
      if (!keyUsage.has(key)) keyUsage.set(key, { clientes: [], classe });
      keyUsage.get(key).clientes.push(c.matricula);
    }
    console.log('');
  }

  console.log(`=== Resumo por chave (quem tem cada uma) ===`);
  [...keyUsage.entries()].sort((a,b)=>b[1].clientes.length-a[1].clientes.length).forEach(([key, info]) => {
    console.log(`  ${key.padEnd(28)} x${info.clientes.length}  [${info.classe}]  ${info.clientes.join(', ')}`);
  });
}

main().then(() => process.exit(0)).catch(e => { console.error('ERRO:', e); process.exit(1); });
