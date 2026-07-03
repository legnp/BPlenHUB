/**
 * BPlen HUB - Auditoria de Concessoes de Admin (execucao LOCAL, somente leitura)
 *
 * Lista todos os documentos User/{matricula}/User_Permissions/access com
 * admin === true e destaca sinais de exploracao da antiga rota publica
 * /api/admin/recover (removida - BUG-003):
 *
 *   - grantedReason === "SYSTEM_EMERGENCY_RECOVERY"  (motivo que a rota gravava)
 *   - matricula em formato de e-mail (a rota usava o proprio e-mail como matricula)
 *
 * Use para revisar se algum admin foi concedido de forma inesperada enquanto a
 * rota esteve aberta. Nao altera nada.
 *
 * Uso:
 *   node scripts/audit-admins.js
 *
 * Requer em .env.local: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 * FIREBASE_PRIVATE_KEY.
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

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

function fmt(ts) {
  if (!ts) return '-';
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
  return String(ts);
}

async function run() {
  // collectionGroup traz todos os docs de qualquer subcolecao User_Permissions
  // (inclui "access" e "quotas"); filtramos "access" com admin === true em codigo
  // para nao depender de indice de collectionGroup.
  const snapshot = await db.collectionGroup('User_Permissions').get();

  const admins = [];
  for (const doc of snapshot.docs) {
    if (doc.id !== 'access') continue;
    const data = doc.data();
    if (data.admin !== true) continue;

    const matricula = doc.ref.parent.parent ? doc.ref.parent.parent.id : '(desconhecida)';
    const reason = data.grantedReason || '-';
    const suspicious =
      reason === 'SYSTEM_EMERGENCY_RECOVERY' ||
      (typeof matricula === 'string' && matricula.includes('@'));

    admins.push({
      matricula,
      role: data.role || '-',
      grantedReason: reason,
      grantedAt: fmt(data.grantedAt),
      updatedBy: data.updatedBy || '-',
      suspicious
    });
  }

  admins.sort((a, b) => Number(b.suspicious) - Number(a.suspicious));

  console.log(`\nTotal de admins encontrados: ${admins.length}\n`);
  for (const a of admins) {
    const flag = a.suspicious ? '  [!] SUSPEITO' : '';
    console.log(`- ${a.matricula}${flag}`);
    console.log(`    role=${a.role} grantedReason=${a.grantedReason} grantedAt=${a.grantedAt} updatedBy=${a.updatedBy}`);
  }

  const flagged = admins.filter(a => a.suspicious);
  if (flagged.length > 0) {
    console.log(`\n[!] ${flagged.length} admin(s) com sinal de recovery/e-mail-como-matricula. Revise manualmente se foram concedidos por voce.`);
  } else {
    console.log('\nNenhum sinal de exploracao da rota removida (recovery/e-mail-como-matricula).');
  }
}

run().catch(err => {
  console.error('Falha na auditoria:', err);
  process.exit(1);
});
