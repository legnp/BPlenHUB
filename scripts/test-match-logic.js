function normalizeStr(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, "-");
}

function isAtaOrFeedbackMatch(activityTitle, refId, itemTitle) {
  const aTitle = normalizeStr(activityTitle);
  const iTitle = normalizeStr(itemTitle);
  const rId = normalizeStr(refId);

  console.log(`aTitle: "${aTitle}"`);
  console.log(`iTitle: "${iTitle}"`);
  console.log(`rId: "${rId}"`);

  if (aTitle === iTitle) return true;
  if (aTitle.includes(iTitle) || iTitle.includes(aTitle)) return true;

  // Keyword exceptions
  if (rId.includes("onboarding") && iTitle.includes("onboarding")) return true;
  if (rId.includes("devolutiva-analise") && (iTitle.includes("devolutiva") || iTitle.includes("perfil"))) return true;
  if (rId.includes("devolutiva-plano") && (iTitle.includes("plano") || iTitle.includes("pdi"))) return true;
  if (rId.includes("mentocoach") && iTitle.includes("mentocoach")) return true;
  if (rId.includes("offboarding") && iTitle.includes("offboarding")) return true;

  return false;
}

const match = isAtaOrFeedbackMatch(
  "Mentoria Individual de Devolutiva de Perfil",
  "devolutiva-analise-comportamental",
  "Feedback - Devolutiva Analise Comportamental"
);

console.log("Match Result:", match);
