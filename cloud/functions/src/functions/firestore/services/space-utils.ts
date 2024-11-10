import {db} from "../../../firebase";


export async function getAllSpaceIds() {
  const spacesResult = await db.collection('spaces').listDocuments()
  return spacesResult.map(doc => doc.id);
}
