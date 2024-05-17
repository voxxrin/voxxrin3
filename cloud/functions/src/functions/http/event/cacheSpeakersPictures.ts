import {Response} from "express";
import {db} from "../../../firebase";
import {DailySchedule, DetailedTalk, Speaker} from "../../../../../../shared/daily-schedule.firestore";
import { Storage } from '@google-cloud/storage';
import * as crypto from "crypto"
import {match, P} from "ts-pattern";
import {wait} from "../../../utils/async-utils";
import {Temporal} from "@js-temporal/polyfill";
import {toValidFirebaseKey} from "../../../../../../shared/utilities/firebase.utils";
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

function urlToFilename(url: string, checksum: string|undefined) {
  const pathChunks = url.split("/");
  const filename = pathChunks[pathChunks.length-1]
  const filenameChunks = filename.split(".");

  const extension = filenameChunks.length > 1 ? "."+filenameChunks[filenameChunks.length-1] : undefined;
  const checksumedFilenameWithoutExtension = filenameChunks.slice(0, -1).concat(...(checksum?[checksum]:[])).join(".")

  const escapedPath = pathChunks.slice(0, -1)
    .concat(checksumedFilenameWithoutExtension)
    .join("/")
    .replace(/https?:\/\/(.+)/, "$1") // Removing [https|http]:// prefix
    .replace(/\//gi, ":") // Replacing / by :

  return { escapedPath, extension };
}

abstract class StorageUploader<T> {
  abstract initialChecks(response: Response): void;
  abstract initialize(): T;
  abstract upload(storage: T, eventId: string, photoUrl: string, cacheUrlCallback: (originalUrlName: string, resizedUrl: string) => Promise<void>): Promise<string>
}

class GoogleStorageUploader extends StorageUploader<Storage> {
  initialChecks(response: Response): void {
    if(!process.env.ASSETS_BUCKET_NAME) {
      return sendResponseMessage(response, 500, `Missing ASSETS_BUCKET_NAME env variable !`)
    }
    if(!process.env.STORAGE_CONFIG) {
      return sendResponseMessage(response, 500, `Missing STORAGE_CONFIG env variable !`)
    }
  }

  initialize(): Storage {
    const STORAGE_CONFIG = JSON.parse(process.env.STORAGE_CONFIG!)

    const storage = new Storage(STORAGE_CONFIG);
    return storage;
  }

  async upload(storage: Storage, eventId: string, photoUrl: string, cacheUrlCallback: (originalUrlName: string, resizedUrl: string) => Promise<void>): Promise<string> {
    const BUCKET_NAME = process.env.ASSETS_BUCKET_NAME!;

    const pictureContent = await fetch(photoUrl).then(resp => resp.arrayBuffer());
    const { escapedPath, extension } = urlToFilename(photoUrl, await contentChecksum(pictureContent))

    const forcedExtension = extension || ".png"

    const bucketFile = storage.bucket(BUCKET_NAME).file(`speaker-pictures/${escapedPath}${forcedExtension}`);
    const originalBucketUrl = bucketFile.publicUrl();
    const resizedFilenameUrl = storage.bucket(BUCKET_NAME).file(`speaker-pictures/resized/${escapedPath}_64x64${forcedExtension}`).publicUrl()

    const [fileExists] = await bucketFile.exists()

    if(!fileExists) {
      try {
        await bucketFile.save(Buffer.from(pictureContent));
      } catch(e: any) {
        console.error(`Error while uploading file ${escapedPath}: ${e.toString()}`)
        return originalBucketUrl
      }
    }

    await cacheUrlCallback(escapedPath+(extension || ""), resizedFilenameUrl);

    // waiting few seconds so that resized pictures get generated
    if(!fileExists) {
      await wait(Temporal.Duration.from({ milliseconds: 2000 }))
    }

    return resizedFilenameUrl
  }
}

type Result = {
  uploadedPictures: Array<{
    speakerFullname: string,
    originalUrl: string,
    resizedUrl: string,
  }>,
  updatedSpeakerPictures: Array<{
    speakerFullname: string,
    originalUrl: string,
    resizedUrl: string,
    forcedUpdate: boolean,
  }>,
  skippedUploads: Array<{
    speakerFullname: string,
  } & ({
    originalUrl: string,
    resizedUrl: string,
    reason: "resized-url-already-exists" | "url-previously-cached-already"
  } | {
    reason: "no-picture"
  })>
}

export async function cacheSpeakersPictures(response: Response, pathParams: {eventId: string}, queryParams: {token: string, force: "true"|"false"}, body: {}) {
  const results: Result = {
    uploadedPictures: [],
    updatedSpeakerPictures: [],
    skippedUploads: []
  }

  const uploader = new GoogleStorageUploader();

  uploader.initialChecks(response);

  const [eventDescriptor, familyOrganizerToken] = await Promise.all([
    getEventDescriptor(pathParams.eventId),
    getFamilyOrganizerToken(queryParams.token),
  ]);

  if(!eventDescriptor.eventFamily || !familyOrganizerToken.eventFamilies.includes(eventDescriptor.eventFamily)) {
    return sendResponseMessage(response, 400, `Provided family organizer token doesn't match with event ${pathParams.eventId} family: [${eventDescriptor.eventFamily}]`)
  }

  const storage = uploader.initialize();

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
      if(!speaker.photoUrl) {
        results.skippedUploads.push({
          speakerFullname: speaker.fullName,
          reason: 'no-picture'
        })
        return;
      }

      const maybeAlreadyCachedUrl = alreadyExistingResizedSpeakerUrls.find(cache => cache.resizedUrl === speaker.photoUrl);
      if(maybeAlreadyCachedUrl && queryParams.force === 'true') {
        // resetting speaker photo url to original url
        speaker.photoUrl = maybeAlreadyCachedUrl.originalUrl;
      }

      const updatedSpeakerUrl = await match([maybeAlreadyCachedUrl, queryParams.force])
        .with([P.nonNullable, 'false'], async ([alreadyCachedUrl, _]) => {
          console.info(`Avoiding to cache [${speaker.photoUrl}] as this was already cached on: ${alreadyCachedUrl.resizedUrl}`)

          results.skippedUploads.push({
            speakerFullname: speaker.fullName,
            reason: "url-previously-cached-already",
            originalUrl: alreadyCachedUrl.originalUrl,
            resizedUrl: alreadyCachedUrl.resizedUrl
          })

          return alreadyCachedUrl.resizedUrl;
        }).otherwise(async ([_1, _2]) => {
          const resizedUrl = await uploader.upload(storage, pathParams.eventId, speaker.photoUrl!, async (originalUrlName: string, resizedUrl: string) => {
            const escapedFilename = toValidFirebaseKey(originalUrlName)
            const firebaseCachedUrlEntry: CachedUrl = {
              originalUrl: speaker.photoUrl!,
              resizedUrl,
              type: 'speaker-picture'
            }
            const cachedUrlDoc = await db.doc(`events/${pathParams.eventId}/resized-speaker-urls/${escapedFilename}`).get()
            try {
              if (cachedUrlDoc.exists) {
                await cachedUrlDoc.ref.update(firebaseCachedUrlEntry)
              } else {
                await cachedUrlDoc.ref.set(firebaseCachedUrlEntry)
              }
            } catch (e: any) {
              console.error(`Error while persisting cached url for speaker-picture [${escapedFilename}]: ${e.toString()}`)
            }
          });

          results.uploadedPictures.push({
            speakerFullname: speaker.fullName,
            originalUrl: speaker.photoUrl!,
            resizedUrl
          })

          return resizedUrl;
        })

      if(speaker.photoUrl !== updatedSpeakerUrl) {
        results.updatedSpeakerPictures.push({
          speakerFullname: speaker.fullName,
          originalUrl: speaker.photoUrl,
          resizedUrl: updatedSpeakerUrl,
          forcedUpdate: queryParams.force === 'true'
        })

        speaker.photoUrl = updatedSpeakerUrl;
        for(const speakerInDailySchedules of (speakerRefsById.get(speaker.id) || [])) {
          speakerInDailySchedules.photoUrl = updatedSpeakerUrl;
        }
      } else {
        results.skippedUploads.push({
          speakerFullname: speaker.fullName,
          originalUrl: speaker.photoUrl,
          resizedUrl: updatedSpeakerUrl,
          reason: 'resized-url-already-exists'
        })
      }
    }))

    await db.doc(`events/${pathParams.eventId}/talks/${talk.id}`).update(talk);
  }))

  await Promise.all(dailySchedules.map(async dailySchedule => {
    await db.doc(`events/${pathParams.eventId}/days/${dailySchedule.day}`).update(dailySchedule);
  }))

  sendResponseMessage(response, 200, results);
}
