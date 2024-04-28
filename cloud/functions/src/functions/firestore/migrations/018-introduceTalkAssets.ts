import {db} from "../../../firebase";


export async function introduceTalkAssets(): Promise<"OK"|"Error"> {
  const eventSnapshots = (
    await db.collection("events")
      .get()
  ).docs

  await Promise.all(eventSnapshots.map(async eventSnapshot => {
    const talksRefs = await db.collection(`events/${eventSnapshot.id}/talks`).listDocuments()

    await Promise.all(talksRefs.map(async talkRef =>
      talkRef.update({
        assets: []
      })
    ));
  }))

  return "OK"
}
