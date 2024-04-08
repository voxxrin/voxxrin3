import {Response} from "express";
import {db} from "../../../firebase";
import {DailySchedule, DetailedTalk, Speaker} from "../../../../../../shared/daily-schedule.firestore";
import { Storage } from '@google-cloud/storage';
import * as crypto from "crypto"
import {match, P} from "ts-pattern";
import {wait} from "../../../utils/async-utils";
import {Temporal} from "@js-temporal/polyfill";
import {toValidFirebaseKey, unescapeFirebaseKey} from "../../../../../../shared/utilities/firebase.utils";
import {sendResponseMessage} from "../utils";
import {getEventDescriptor} from "../../firestore/services/eventDescriptor-utils";
import {getFamilyOrganizerToken} from "../../firestore/services/publicTokens-utils";

type CachedUrl = {
  originalUrl: string,
  type: "speaker-picture",
  resizedUrl: string,
}

async function contentChecksum(content: ArrayBuffer) {
  const uint8Array = new Uint8Array(await content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', uint8Array);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((h) => h.toString(16).padStart(2, '0')).join('');
}

function urlToFilename(url: string, checksum: string) {
  const pathChunks = url.split("/");
  const filename = pathChunks[pathChunks.length-1]
  const filenameChunks = filename.split(".");

  const extension = filenameChunks.length > 1 ? "."+filenameChunks[filenameChunks.length-1] : undefined;
  const checksumedFilenameWithoutExtension = filenameChunks.slice(0, -1).concat(checksum).join(".")

  const escapedPath = pathChunks.slice(0, -1)
    .concat(checksumedFilenameWithoutExtension)
    .join("/")
    .replace(/https?:\/\/(.+)/, "$1") // Removing [https|http]:// prefix
    .replace(/\//gi, ":") // Replacing / by :

  return { escapedPath, extension };
}

export async function cacheSpeakersPictures(response: Response, pathParams: {eventId: string}, queryParams: {token: string, force: "true"|"false"}, body: {}) {
  if(!process.env.ASSETS_BUCKET_NAME) {
    return sendResponseMessage(response, 500, `Missing ASSETS_BUCKET_NAME env variable !`)
  }
  if(!process.env.STORAGE_CONFIG) {
    return sendResponseMessage(response, 500, `Missing STORAGE_CONFIG env variable !`)
  }

  const [eventDescriptor, familyOrganizerToken] = await Promise.all([
    getEventDescriptor(pathParams.eventId),
    getFamilyOrganizerToken(queryParams.token),
  ]);

  if(!eventDescriptor.eventFamily || !familyOrganizerToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
    return sendResponseMessage(response, 400, `Provided family organizer token doesn't match with event ${pathParams.eventId} family: [${eventDescriptor.eventFamily}]`)
  }

  const BUCKET_NAME = process.env.ASSETS_BUCKET_NAME;
  const STORAGE_CONFIG = JSON.parse(process.env.STORAGE_CONFIG)

  const storage = new Storage(STORAGE_CONFIG);

  const dailySchedules = (await db.collection(`events/${pathParams.eventId}/days`).get()).docs.map(d => d.data() as DailySchedule)
  const speakerRefsById = new Map<string, Speaker[]>()
  for(const dailySchedule of dailySchedules) {
    for(const timeslot of dailySchedule.timeSlots) {
      if(timeslot.type === 'talks') {
        for(const talk of timeslot.talks) {
          for(const speaker of talk.speakers) {
            speakerRefsById.set(speaker.id, (speakerRefsById.get(speaker.id) || []).concat(speaker))
          }
        }
      }
    }
  }

  const alreadyExistingResizedSpeakerUrlsCollection = await db.collection(`events/${pathParams.eventId}/resized-speaker-urls`).get()
  const alreadyExistingResizedSpeakerUrls = alreadyExistingResizedSpeakerUrlsCollection.docs.map(d => d.data() as CachedUrl)

  const eventTalks = (await db.collection(`events/${pathParams.eventId}/talks`).get()).docs.map(d => d.data() as DetailedTalk)

  await Promise.all(eventTalks.map(async talk => {
    await Promise.all(talk.speakers.map(async speaker => {
      const alreadyCachedUrl = speaker.photoUrl && decodeURIComponent(speaker.photoUrl).includes(`/${BUCKET_NAME}/speaker-pictures/`);
      if(speaker.photoUrl
        && (!alreadyCachedUrl || queryParams.force === 'true')
      ) {
        const photoUrl = speaker.photoUrl;
        const maybeAlreadyCachedUrl = alreadyExistingResizedSpeakerUrls.find(cache => cache.originalUrl === speaker.photoUrl);

        if(alreadyCachedUrl && queryParams.force === 'true' && maybeAlreadyCachedUrl) {
          speaker.photoUrl = maybeAlreadyCachedUrl.originalUrl
          // TODO: we should consider to consider maybeAlreadyCachedUrl is undefined so that we enter the first part of the match() below
        }

        const updatedSpeakerUrl = await match(maybeAlreadyCachedUrl)
          .with(P.nullish, async () => {
            const pictureContent = await fetch(photoUrl).then(resp => resp.arrayBuffer());
            const { escapedPath, extension } = urlToFilename(photoUrl, await contentChecksum(pictureContent))

            const bucketFile = storage.bucket(BUCKET_NAME).file(`speaker-pictures/${escapedPath}${extension || ""}`);
            const originalBucketUrl = bucketFile.publicUrl();
            const resizedFilenameUrl = storage.bucket(BUCKET_NAME).file(`speaker-pictures/resized/${escapedPath}_64x64${extension || ""}`).publicUrl()

            const [fileExists] = await bucketFile.exists()

            return match({ fileExists })
              .with({ fileExists: true }, async () => {
                // TODO: update cachedUrlDoc !
                return resizedFilenameUrl
              })
              .otherwise(async () => {
                try {
                  await bucketFile.save(Buffer.from(pictureContent));

                  const escapedFilename = toValidFirebaseKey(escapedPath+(extension || ""))
                  const firebaseCachedUrlEntry: CachedUrl = {
                    originalUrl: photoUrl!,
                    resizedUrl: resizedFilenameUrl,
                    type: 'speaker-picture'
                  }
                  const cachedUrlDoc = db.doc(`events/${pathParams.eventId}/resized-speaker-urls/${escapedFilename}`)
                  try {
                    if((await cachedUrlDoc.get()).exists) {
                      await cachedUrlDoc.update(firebaseCachedUrlEntry)
                    } else {
                      await cachedUrlDoc.set(firebaseCachedUrlEntry)
                    }
                  }catch(e: any) {
                    console.error(`Error while persisting cached url for speaker-picture [${escapedPath}]: ${e.toString()}`)
                  }

                  // waiting few seconds so that resized pictures get generated
                  await wait(Temporal.Duration.from({ milliseconds: 2000 }))

                  return resizedFilenameUrl;
                } catch(e: any) {
                  console.error(`Error while uploading file ${escapedPath}: ${e.toString()}`)
                  return originalBucketUrl
                }
              });
          }).otherwise(async alreadyCachedUrl => {
            console.info(`Avoiding to cache [${photoUrl}] as this was already cached on: ${alreadyCachedUrl.resizedUrl}`)
            return alreadyCachedUrl.resizedUrl;
          })

        speaker.photoUrl = updatedSpeakerUrl;
        for(const speakerInDailySchedules of (speakerRefsById.get(speaker.id) || [])) {
          speakerInDailySchedules.photoUrl = updatedSpeakerUrl;
        }
      }
    }))

    await db.doc(`events/${pathParams.eventId}/talks/${talk.id}`).update(talk);
  }))

  await Promise.all(dailySchedules.map(async dailySchedule => {
    await db.doc(`events/${pathParams.eventId}/days/${dailySchedule.day}`).update(dailySchedule);
  }))

  sendResponseMessage(response, 200);
}
