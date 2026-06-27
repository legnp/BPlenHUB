function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\b(de|em|e|para|da|do|dos|das)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const quotas = {
  quotas: {
    "1-to-1": { total: 40, used: 0 },
    "analise-comportamental": { total: 2, used: 0 },
    "ORIENTACAO-INDIVIDUAL": { total: 0, used: 0 },
    "PLANO-DE-CARREIRA": { total: 1, used: 0 },
    "POSICIONAMENTO-PROFISSIONAL": { total: 1, used: 0 },
    "GESTAO-E-DESENVOLVIMENTO": { total: 1, used: 0 },
    "ANALISE-COMPORTAMENTAL": { total: 8, used: 0 }
  }
};

const stepId = "gestao-e-desenvolvimento";

const stepIdUpper = stepId.toUpperCase();
const stepIdLower = stepId.toLowerCase();
let hasQuota = false;

const stepIdNormalized = normalizeString(stepId);
console.log(`stepIdNormalized: "${stepIdNormalized}"`);

for (const [quotaKey, quotaData] of Object.entries(quotas.quotas)) {
  if (quotaData.total <= 0) continue;
  
  const quotaKeyNormalized = normalizeString(quotaKey);
  console.log(`Checking quotaKey: "${quotaKey}" -> normalized: "${quotaKeyNormalized}"`);
  
  if (quotaKeyNormalized === stepIdNormalized || quotaKeyNormalized.includes(stepIdNormalized) || stepIdNormalized.includes(quotaKeyNormalized)) {
     hasQuota = true;
     console.log("Matched normalized!");
     break;
  }

  // Fallback check we added
  if (quotaKey.toLowerCase().replace(/[-_]/g, "") === stepIdLower.replace(/[-_]/g, "")) {
     hasQuota = true;
     console.log("Matched fallback!");
     break;
  }
}

console.log(`Result: hasQuota = ${hasQuota}`);
