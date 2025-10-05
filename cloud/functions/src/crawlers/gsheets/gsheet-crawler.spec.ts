import {describe, assert, it } from 'vitest'
import {crawlGsheet} from "./gsheets-crawler";
import type {FullEvent} from "../../models/Event";

describe('gsheet crawler', async () => {
  it(`Trying to crawl sample crawler`, async () => {
    const event = await crawlGsheet('testing event', '1iQ5ayjAo8VyIIid61zJXa864j8xZXt4DOFUyuZPYtOo');

    const expectedEvent: FullEvent = {
      "id": "testing event",
      "info": {
        "id": "testing event",
        "title": "Long event title",
        "description": "2 days of shared experiences",
        "days": [
          {
            "id": "mercredi",
            "localDate": "2024-04-17"
          },
          {
            "id": "jeudi",
            "localDate": "2024-04-18"
          }
        ],
        "timezone": "Europe/Paris",
        "keywords": [
          "tech",
          "web"
        ],
        "location": {
          "country": "France",
          "city": "Paris",
          "address": "2 place de la porte maillot",
          "coords": {
            "latitude": 48.87954595400954,
            "longitude": 2.2835584670392524
          }
        },
        "peopleDescription": "100+ participants",
        "backgroundUrl": "https://res.cloudinary.com/du7q1xw75/image/upload/v1716939222/jthj59ixhdmfqgelmf0k.jpg",
        "logoUrl": "https://res.cloudinary.com/du7q1xw75/image/upload/v1716939369/yt2sh1nbs8php3akuzvl.png",
        "theming": {
          "colors": {
            "light": {
              "primaryHex": "#000000",
              "primaryContrastHex": "#ffffff",
              "secondaryHex": "#434446",
              "secondaryContrastHex": "#ffffff",
              "tertiaryHex": "#7B6AA7",
              "tertiaryContrastHex": "#ffffff"
            },
            "dark": {
              "primaryHex": "#ED203D",
              "primaryContrastHex": "#ffffff",
              "secondaryHex": "#434446",
              "secondaryContrastHex": "#ffffff",
              "tertiaryHex": "#7B6AA7",
              "tertiaryContrastHex": "#ffffff"
            }
          },
          "headingCustomStyles": {
            "title": "color: white; font-family: Poppins, sans-serif;",
            "subTitle": "color: white; font-family: Poppins, sans-serif;",
            "banner": null
          },
          "headingSrcSet": [
            {
              "descriptor": "500w",
              "url": "https://www.devoxx.fr/wp-content/uploads/2025/03/devoxx_fr_25_voxxrin_500.png"
            },
            {
              "descriptor": "1000w",
              "url": "https://www.devoxx.fr/wp-content/uploads/2025/03/devoxx_fr_25_voxxrin_1000.png"
            },
            {
              "descriptor": "2000w",
              "url": "https://www.devoxx.fr/wp-content/uploads/2025/03/devoxx_fr_25_voxxrin_2000.png"
            }
          ],
          "customImportedFonts": [
            {
              "provider": "google-fonts",
              "family": "Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900"
            }
          ]
        }
      },
      "daySchedules": [
        {
          "day": "mercredi",
          "timeSlots": [
            {
              "id": "2024-04-17T09:00:00+02:00--2024-04-17T09:30:00+02:00",
              "type": "talks",
              "talks": [
                {
                  "id": "1",
                  "room": {
                    "id": "s1",
                    "title": "Salle 1"
                  },
                  "format": {
                    "id": "keynote",
                    "title": "Keynote",
                    "duration": "PT30m",
                    "themeColor": "#165CE3"
                  },
                  "track": {
                    "id": "numbers",
                    "title": "Chiffres",
                    "themeColor": "#DA8DE0"
                  },
                  "title": "Keynote de démarrage",
                  "speakers": [
                    {
                      "id": "frederic-camblor",
                      "fullName": "Frédéric Camblor",
                      "photoUrl": "https://pbs.twimg.com/profile_images/1191995569364975616/7NnECJaV_400x400.png",
                      "companyName": "4SH",
                      "bio": "",
                      "social": [
                        {
                          "type": "twitter",
                          "url": "@fcamblor"
                        },
                        {
                          "type": "linkedin",
                          "url": "frederic-camblor"
                        },
                        {
                          "type": "github",
                          "url": "fcamblor"
                        }
                      ]
                    }
                  ],
                  "language": "fr",
                  "isOverflow": false
                }
              ],
              "start": "2024-04-17T09:00:00+02:00",
              "end": "2024-04-17T09:30:00+02:00"
            },
            {
              "id": "2024-04-17T11:50:00+02:00--2024-04-17T13:20:00+02:00--hall",
              "type": "break",
              "start": "2024-04-17T11:50:00+02:00",
              "end": "2024-04-17T13:20:00+02:00",
              "break": {
                "icon": "restaurant",
                "title": "Déjeuner",
                "room": {
                  "id": "hall",
                  "title": "Hall"
                }
              }
            }
          ]
        },
        {
          "day": "jeudi",
          "timeSlots": [
            {
              "id": "2024-04-18T09:00:00+02:00--2024-04-18T09:30:00+02:00",
              "type": "talks",
              "talks": [
                {
                  "id": "3",
                  "room": {
                    "id": "s1",
                    "title": "Salle 1"
                  },
                  "format": {
                    "id": "keynote",
                    "title": "Keynote",
                    "duration": "PT30m",
                    "themeColor": "#165CE3"
                  },
                  "track": {
                    "id": "projects",
                    "title": "Projets",
                    "themeColor": "#EA7872"
                  },
                  "title": "Keynote J2",
                  "speakers": [
                    {
                      "id": "frederic-camblor",
                      "fullName": "Frédéric Camblor",
                      "photoUrl": "https://pbs.twimg.com/profile_images/1191995569364975616/7NnECJaV_400x400.png",
                      "companyName": "4SH",
                      "bio": "",
                      "social": [
                        {
                          "type": "twitter",
                          "url": "@fcamblor"
                        },
                        {
                          "type": "linkedin",
                          "url": "frederic-camblor"
                        },
                        {
                          "type": "github",
                          "url": "fcamblor"
                        }
                      ]
                    }
                  ],
                  "language": "fr",
                  "isOverflow": false
                }
              ],
              "start": "2024-04-18T09:00:00+02:00",
              "end": "2024-04-18T09:30:00+02:00"
            }
          ]
        }
      ],
      "talks": [
        {
          "id": "1",
          "room": {
            "id": "s1",
            "title": "Salle 1"
          },
          "format": {
            "id": "keynote",
            "title": "Keynote",
            "duration": "PT30m",
            "themeColor": "#165CE3"
          },
          "track": {
            "id": "numbers",
            "title": "Chiffres",
            "themeColor": "#DA8DE0"
          },
          "title": "Keynote de démarrage",
          "speakers": [
            {
              "id": "frederic-camblor",
              "fullName": "Frédéric Camblor",
              "photoUrl": "https://pbs.twimg.com/profile_images/1191995569364975616/7NnECJaV_400x400.png",
              "companyName": "4SH",
              "bio": "",
              "social": [
                {
                  "type": "twitter",
                  "url": "@fcamblor"
                },
                {
                  "type": "linkedin",
                  "url": "frederic-camblor"
                },
                {
                  "type": "github",
                  "url": "fcamblor"
                }
              ]
            }
          ],
          "language": "fr",
          "isOverflow": false,
          "start": "2024-04-17T09:00:00+02:00",
          "end": "2024-04-17T09:30:00+02:00",
          "summary": "Une super présentation qui parle de sujets intéressants",
          "description": "Une super présentation qui parle de sujets intéressants",
          "tags": [],
          "assets": []
        },
        {
          "id": "3",
          "room": {
            "id": "s1",
            "title": "Salle 1"
          },
          "format": {
            "id": "keynote",
            "title": "Keynote",
            "duration": "PT30m",
            "themeColor": "#165CE3"
          },
          "track": {
            "id": "projects",
            "title": "Projets",
            "themeColor": "#EA7872"
          },
          "title": "Keynote J2",
          "speakers": [
            {
              "id": "frederic-camblor",
              "fullName": "Frédéric Camblor",
              "photoUrl": "https://pbs.twimg.com/profile_images/1191995569364975616/7NnECJaV_400x400.png",
              "companyName": "4SH",
              "bio": "",
              "social": [
                {
                  "type": "twitter",
                  "url": "@fcamblor"
                },
                {
                  "type": "linkedin",
                  "url": "frederic-camblor"
                },
                {
                  "type": "github",
                  "url": "fcamblor"
                }
              ]
            }
          ],
          "language": "fr",
          "isOverflow": false,
          "start": "2024-04-18T09:00:00+02:00",
          "end": "2024-04-18T09:30:00+02:00",
          "summary": "blablabla",
          "description": "blablabla",
          "tags": [],
          "assets": []
        }
      ],
      "conferenceDescriptor": {
        "id": "testing event",
        "title": "Long event title",
        "description": "2 days of shared experiences",
        "days": [
          {
            "id": "mercredi",
            "localDate": "2024-04-17"
          },
          {
            "id": "jeudi",
            "localDate": "2024-04-18"
          }
        ],
        "timezone": "Europe/Paris",
        "keywords": [
          "tech",
          "web"
        ],
        "location": {
          "country": "France",
          "city": "Paris",
          "address": "2 place de la porte maillot",
          "coords": {
            "latitude": 48.87954595400954,
            "longitude": 2.2835584670392524
          }
        },
        "peopleDescription": "100+ participants",
        "backgroundUrl": "https://res.cloudinary.com/du7q1xw75/image/upload/v1716939222/jthj59ixhdmfqgelmf0k.jpg",
        "logoUrl": "https://res.cloudinary.com/du7q1xw75/image/upload/v1716939369/yt2sh1nbs8php3akuzvl.png",
        "theming": {
          "colors": {
            "light": {
              "primaryHex": "#000000",
              "primaryContrastHex": "#ffffff",
              "secondaryHex": "#434446",
              "secondaryContrastHex": "#ffffff",
              "tertiaryHex": "#7B6AA7",
              "tertiaryContrastHex": "#ffffff"
            },
            "dark": {
              "primaryHex": "#ED203D",
              "primaryContrastHex": "#ffffff",
              "secondaryHex": "#434446",
              "secondaryContrastHex": "#ffffff",
              "tertiaryHex": "#7B6AA7",
              "tertiaryContrastHex": "#ffffff"
            }
          },
          "headingCustomStyles": {
            "title": "color: white; font-family: Poppins, sans-serif;",
            "subTitle": "color: white; font-family: Poppins, sans-serif;",
            "banner": null
          },
          "headingSrcSet": [
            {
              "descriptor": "500w",
              "url": "https://www.devoxx.fr/wp-content/uploads/2025/03/devoxx_fr_25_voxxrin_500.png"
            },
            {
              "descriptor": "1000w",
              "url": "https://www.devoxx.fr/wp-content/uploads/2025/03/devoxx_fr_25_voxxrin_1000.png"
            },
            {
              "descriptor": "2000w",
              "url": "https://www.devoxx.fr/wp-content/uploads/2025/03/devoxx_fr_25_voxxrin_2000.png"
            }
          ],
          "customImportedFonts": [
            {
              "provider": "google-fonts",
              "family": "Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900"
            }
          ]
        },
        "headingTitle": "Shorter title",
        "headingSubTitle": "Heading subtitle here",
        "headingBackground": null,
        "features": {
          "favoritesEnabled": true,
          "roomsDisplayed": true,
          "showInfosTab": true,
          "showRoomCapacityIndicator": false,
          "hideLanguages": [
            "fr"
          ],
          "remindMeOnceVideosAreAvailableEnabled": false,
          "ratings": {
            "bingo": {
              "enabled": true,
              "choices": [
                {
                  "id": "too-long",
                  "label": "C'était trop long"
                },
                {
                  "id": "interesting",
                  "label": "C'était intéressant"
                },
                {
                  "id": "amazing-speakers",
                  "label": "Les orateurs/rices était captivant(e)s"
                },
                {
                  "id": "good-moment",
                  "label": "J'ai passé un bon moment"
                }
              ]
            },
            "scale": {
              "enabled": true,
              "icon": "star",
              "labels": [
                "Je me suis endormi",
                "Passable",
                "C'était intéressant !",
                "La meilleure présentation de ma vie 🤩 !"
              ]
            },
            "free-text": {
              "enabled": false,
              "maxLength": 42
            },
            "custom-scale": {
              "enabled": false,
              "choices": []
            }
          },
          "topRatedTalks": {
            "minimumNumberOfRatingsToBeConsidered": 10,
            "minimumAverageScoreToBeConsidered": 3,
            "numberOfDailyTopTalksConsidered": 10
          }
        },
        "talkFormats": [
          {
            "id": "keynote",
            "title": "Keynote",
            "duration": "PT30m",
            "themeColor": "#165CE3"
          },
          {
            "id": "conference50m",
            "title": "Conférence",
            "duration": "PT50m",
            "themeColor": "#EA7872"
          },
          {
            "id": "conference30m",
            "title": "Conférence",
            "duration": "PT30m",
            "themeColor": "#EA7872"
          },
          {
            "id": "lunch",
            "title": "Déjeuner",
            "duration": "PT90m",
            "themeColor": "#935A59"
          }
        ],
        "talkTracks": [
          {
            "id": "projects",
            "title": "Projets",
            "themeColor": "#EA7872"
          },
          {
            "id": "numbers",
            "title": "Chiffres",
            "themeColor": "#DA8DE0"
          }
        ],
        "supportedTalkLanguages": [
          {
            "id": "fr",
            "label": "FR",
            "themeColor": "#165CE3"
          },
          {
            "id": "en",
            "label": "EN",
            "themeColor": "#165CE3"
          }
        ],
        "rooms": [
          {
            "id": "hall",
            "title": "Hall"
          },
          {
            "id": "s1",
            "title": "Salle 1"
          },
          {
            "id": "s2",
            "title": "Salle 2"
          }
        ],
        "infos": {
          "floorPlans": [
            {
              "label": "1er étage",
              "pictureUrl": "https://devoxxian-image-thumbnails.s3-eu-west-1.amazonaws.com/9a6f96dc-9105-4216-a781-543b1884207b.png"
            },
            {
              "label": "2nd étage",
              "pictureUrl": "https://devoxxian-image-thumbnails.s3-eu-west-1.amazonaws.com/602c463e-ba11-4829-a95b-b868161fb033.png"
            },
            {
              "label": "Hall d'exposition",
              "pictureUrl": "https://devoxxian-image-thumbnails.s3-eu-west-1.amazonaws.com/29cbe0e7-c6ce-4af1-a26c-1d9e7c873437.png"
            }
          ],
          "socialMedias": [
            {
              "type": "twitter",
              "href": "@fcamblor"
            }
          ],
          "sponsors": [
            {
              "type": "Platinium",
              "typeColor": "deepSkyBlue",
              "typeFontColor": "white",
              "sponsorships": [
                {
                  "name": "4SH",
                  "logoUrl": "https://res.cloudinary.com/du7q1xw75/image/upload/v1716939369/yt2sh1nbs8php3akuzvl.png",
                  "href": "https://4sh.fr"
                }
              ]
            },
            {
              "type": "Gold",
              "typeColor": "#ff0",
              "typeFontColor": "black",
              "sponsorships": []
            },
            {
              "type": "Bronze",
              "typeColor": "brown",
              "typeFontColor": "lightsalmon",
              "sponsorships": []
            },
            {
              "type": "Meet&Greet",
              "typeColor": "lime",
              "typeFontColor": "black",
              "sponsorships": []
            }
          ]
        },
        "formattings": {
          "talkFormatTitle": "with-duration",
          "parseMarkdownOn": []
        }
      }
    };

    // for debug purposes
    // await writeFile("/tmp/event-expected.json", JSON.stringify(expectedEvent, null, 2));
    // await writeFile("/tmp/event-actual.json", JSON.stringify(event, null, 2));
    assert.deepEqual(event, expectedEvent);
  });
})
