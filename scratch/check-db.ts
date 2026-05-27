import { getAdminDb } from "../src/lib/firebase-admin";

async function checkForms() {
  const db = getAdminDb();
  console.log("Checking Forms collection group...");
  const snapshot = await db.collectionGroup("Forms").get();
  console.log(`Found ${snapshot.docs.length} forms in total.`);
  
  const ids = new Set();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    ids.add(data.formId);
    if (data.formId === "dados_cadastrais") {
      console.log(`Found a 'dados_cadastrais' document for user: ${data.matricula}`);
    }
  });
  
  console.log("Form IDs found in DB:", Array.from(ids));
  
  console.log("---");
  console.log("Checking Surveys collection group...");
  const surveysSnapshot = await db.collectionGroup("Surveys").get();
  console.log(`Found ${surveysSnapshot.docs.length} surveys in total.`);
  const sids = new Set();
  surveysSnapshot.docs.forEach(doc => sids.add(doc.data().surveyId));
  console.log("Survey IDs found in DB:", Array.from(sids));
}

checkForms().catch(console.error);
