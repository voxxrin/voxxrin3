import {db} from "../../../firebase";


export async function cleaningUnusedFirestoreDocs(): Promise<"OK"|"Error"> {
  const eventFamilyTokensColl = await db.collection(`event-family-tokens`).get()
  if(!eventFamilyTokensColl.empty) {
    await Promise.all(eventFamilyTokensColl.docs.map(async eventFamilyToken => {
      return eventFamilyToken.ref.delete()
    }))
  }

  return "OK"
}
