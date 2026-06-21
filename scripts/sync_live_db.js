const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Manually parse .env.local to load the configuration
const workspacePath = path.join(__dirname, '..');
const envPath = path.join(workspacePath, '.env.local');

console.log('Loading environment from:', envPath);
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[match[1]] = value.replace(/\\n/g, '\n');
    }
  });
}

console.log('Firebase project id:', process.env.FIREBASE_PROJECT_ID);

// 2. Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
    })
  });
}

const db = admin.firestore();
const PRODUCTS_COLLECTION = "products";
const COUPONS_COLLECTION = "coupons";

async function runSync() {
  console.log('--- STARTING FIREBASE PORTFOLIO SYNC ---');

  // Read portfolio_payload.json
  const portfolioPayloadPath = path.join(workspacePath, 'portfolio', 'portfolio_payload.json');
  if (!fs.existsSync(portfolioPayloadPath)) {
    console.error('Portfolio payload not found at:', portfolioPayloadPath);
    return;
  }
  const portfolio = JSON.parse(fs.readFileSync(portfolioPayloadPath, 'utf8'));
  console.log(`Loaded ${portfolio.length} products from portfolio_payload.json`);

  // Read campanhas_payload.json
  const campanhasPayloadPath = path.join(workspacePath, 'portfolio', 'campanhas_payload.json');
  let coupons = [];
  if (fs.existsSync(campanhasPayloadPath)) {
    coupons = JSON.parse(fs.readFileSync(campanhasPayloadPath, 'utf8'));
    console.log(`Loaded ${coupons.length} coupons from campanhas_payload.json`);
  } else {
    console.log('No campanhas_payload.json found.');
  }

  // Fetch current products snapshot for backup
  console.log('Fetching current products from Firestore...');
  const productsSnapshot = await db.collection(PRODUCTS_COLLECTION).get();
  console.log(`Found ${productsSnapshot.size} products currently in Firestore.`);

  // Create a backup collection
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const backupColName = `products_backup_${timestamp}`;
  console.log(`Creating differential backup in collection: ${backupColName}...`);

  const backupBatch = db.batch();
  productsSnapshot.docs.forEach(doc => {
    const backupRef = db.collection(backupColName).doc(doc.id);
    backupBatch.set(backupRef, doc.data());
  });
  await backupBatch.commit();
  console.log('Backup collection committed successfully.');

  // Fetch current coupons snapshot for backup if we have new coupons
  let couponsBackupCol = "";
  if (coupons.length > 0) {
    const couponsSnapshot = await db.collection(COUPONS_COLLECTION).get();
    if (!couponsSnapshot.empty) {
      couponsBackupCol = `coupons_backup_${timestamp}`;
      console.log(`Creating coupons backup in collection: ${couponsBackupCol}...`);
      const couponsBackupBatch = db.batch();
      couponsSnapshot.docs.forEach(doc => {
        const bRef = db.collection(couponsBackupCol).doc(doc.id);
        couponsBackupBatch.set(bRef, doc.data());
      });
      await couponsBackupBatch.commit();
      console.log('Coupons backup committed successfully.');
    }
  }

  // Perform synchronization
  console.log('Writing new products and coupons to Firestore...');
  const syncBatch = db.batch();
  const payloadSlugs = new Set(portfolio.map(p => p.slug));

  portfolio.forEach(product => {
    const existingDoc = productsSnapshot.docs.find(d => d.id === product.slug);
    const createdAt = existingDoc ? (existingDoc.data().createdAt || new Date().toISOString()) : new Date().toISOString();
    const updatedAt = new Date().toISOString();

    const productToSave = {
      ...product,
      createdAt,
      updatedAt
    };

    const docRef = db.collection(PRODUCTS_COLLECTION).doc(product.slug);
    syncBatch.set(docRef, productToSave);
    console.log(`   [SAVE/UPDATE] Product: ${product.title} (Slug: ${product.slug})`);
  });

  // Archive old ones
  let archivedCount = 0;
  productsSnapshot.docs.forEach(doc => {
    if (!payloadSlugs.has(doc.id)) {
      const docData = doc.data();
      if (docData.status !== 'archived') {
        const docRef = db.collection(PRODUCTS_COLLECTION).doc(doc.id);
        syncBatch.update(docRef, {
          status: 'archived',
          updatedAt: new Date().toISOString()
        });
        archivedCount++;
        console.log(`   [ARCHIVE] Product: ${docData.title || doc.id} (Slug: ${doc.id})`);
      }
    }
  });

  // Sync coupons
  if (coupons.length > 0) {
    const couponsSnapshot = await db.collection(COUPONS_COLLECTION).get();
    const couponsSlugs = new Set(coupons.map(c => c.code));

    coupons.forEach(coupon => {
      const existingCp = couponsSnapshot.docs.find(d => d.id === coupon.code);
      const createdAt = existingCp ? (existingCp.data().createdAt || new Date().toISOString()) : new Date().toISOString();
      const updatedAt = new Date().toISOString();
      const usageCount = existingCp ? (existingCp.data().usageCount || 0) : 0;

      const couponToSave = {
        ...coupon,
        createdAt,
        updatedAt,
        usageCount
      };

      const docRef = db.collection(COUPONS_COLLECTION).doc(coupon.code);
      syncBatch.set(docRef, couponToSave);
      console.log(`   [SAVE/UPDATE] Coupon: ${coupon.code}`);
    });

    couponsSnapshot.docs.forEach(doc => {
      if (!couponsSlugs.has(doc.id)) {
        const docData = doc.data();
        if (docData.active !== false) {
          const docRef = db.collection(COUPONS_COLLECTION).doc(doc.id);
          syncBatch.update(docRef, {
            active: false,
            updatedAt: new Date().toISOString()
          });
          console.log(`   [DEACTIVATE] Coupon: ${doc.id}`);
        }
      }
    });
  }

  await syncBatch.commit();
  console.log('--- FIREBASE PORTFOLIO SYNC CONCLUDED SUCCESSFULLY ---');
  console.log(`Successfully synced ${portfolio.length} products, archived ${archivedCount} old products, synced ${coupons.length} coupons.`);
}

runSync().catch(err => {
  console.error('Critical error during sync:', err);
});
