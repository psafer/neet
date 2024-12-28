import admin from "firebase-admin";
import fs from "fs/promises";

const serviceAccount = JSON.parse(
  await fs.readFile("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function getSubcollections(docRef) {
  const subcollections = await docRef.listCollections();
  const subData = {};

  for (const subcollection of subcollections) {
    const subcollectionData = await getCollectionData(subcollection.id, docRef);
    subData[subcollection.id] = subcollectionData;
  }

  return subData;
}

async function getCollectionData(collectionName, parentRef = null) {
  const collectionRef = parentRef
    ? parentRef.collection(collectionName)
    : db.collection(collectionName);
  const snapshot = await collectionRef.get();
  const data = {};

  for (const doc of snapshot.docs) {
    const docData = doc.data();
    docData.subcollections = await getSubcollections(doc.ref); // Rekurencyjne pobieranie podkolekcji
    data[doc.id] = docData;
  }

  return data;
}

async function exportSchema() {
  const collections = await db.listCollections();
  const schema = {};

  for (const collection of collections) {
    const collectionName = collection.id;
    console.log(`Eksportuję kolekcję: ${collectionName}`);
    schema[collectionName] = await getCollectionData(collectionName);
  }

  await fs.writeFile(
    "firestoreSchema_with_subcollections.json",
    JSON.stringify(schema, null, 2)
  );
  console.log(
    "Schemat zapisany w pliku firestoreSchema_with_subcollections.json"
  );
}

exportSchema().catch((error) => {
  console.error("Błąd podczas eksportu schematu:", error);
});
