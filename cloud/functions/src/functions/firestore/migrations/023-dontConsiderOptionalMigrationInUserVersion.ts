import {getUserDocsMatching} from "../services/user-utils";

export async function dontConsiderOptionalMigrationInUserVersion(): Promise<"OK"|"Error"> {

  const v1UserDocs = await getUserDocsMatching(coll => coll.where("_version", "==", 1));
  const v2UserDocs = await getUserDocsMatching(coll => coll.where("_version", "==", 2));

  await Promise.all([
    Promise.all(v1UserDocs.map(async v1UserDoc => {
      return v1UserDoc.ref.update({
        _version: 3,
        _modelRemainingMigrations: ["delete-remote-tokens-wallet"]
      })
    })),
    Promise.all(v2UserDocs.map(async v2UserDoc => {
      return v2UserDoc.ref.update({
        _version: 3,
        _modelRemainingMigrations: []
      })
    })),
  ])

  return "OK"
}
