# Voxxr.in

Voxxrin is your mobile conference companion.

## Project bootstrap

Run `npm run bootstrap` (from root folder) once for all to install every required npm dependencies and initialize your local firebase emulator environment.

Then, to start both the backend (firebase emulator) and the frontend, simply run `npm run dev` from root folder.

On started, you should be able to open http://localhost:5173/ to access your local voxxrin instance.

## First crawler configuration

Open your firestore instance (you can access it locally through http://localhost:4000/firestore/default/data) then :
- create a new root document (`Start collection` button) with:
  - collection id: `crawlers`
  - document id: `sample-event`
  - following fields:

| name | type | value  |
|------|------|--------|
| descriptorUrl | string | `https://gist.github.com/fcamblor/6be34b50207d15f4d6202dfab780e409/raw/11661fb229ee4e0156908e2ca06d8a0c4f912619/videbays2025.json` |
| eventFamily | string | `samples` |
| eventId | string | `sample-event` |
| eventName | string | `sample-event` |
| kind | string | `single-file` |

- create another root document (`Start collection` button) with:
  - collection id: `public-tokens`
  - document id: `familyOrganizer:samples:ffffffff-ffff-ffff-ffff-ffffffffffff`
  - following fields:

| name | type | value  |
|------|------|--------|
| eventFamilies | array of strings | `["samples"]` |
| type | string | `FamilyOrganizerToken` |

- Once done, trigger a crawling for this new event using following curl command:
```
curl --request POST --url 'http://localhost:5001/voxxrin-v3/us-central1/api/crawlers/sample-event/refreshScheduleRequest?token=familyOrganizer%3Asamples%3Affffffff-ffff-ffff-ffff-ffffffffffff'
```

You should get a successful execution summary, and should be able to see *a new event* popping on your local voxxrin instance's `Past Events` tab.

## Project structure

Voxxrin is a mobile app developed using ionic / capacitor + vue, with a serverless backend relying on several Firebase services (auth, firestore, cloud functions).

The mobile app is located in the `mobile` directory, and serverless firebase code is located in the `cloud` directory.

Each of these directories have their own `README.md` describing how to set them up.

## Tour of the features

Look at [Feature showcase](https://github.com/voxxrin/voxxrin3/wiki/Voxxrin-3-features-showcase) to have an overview of currently-implemented Voxxrin features.

## How to add your own conference to the list ?

Voxxrin is currently in a closed beta mode.

However, if you are interested into adding your conference to the list, drop us an email at `contact` at `voxxr.in`, describing where we can retrieve your schedule (API ? Website ?).

We will try to get back to you as soon as possible.
