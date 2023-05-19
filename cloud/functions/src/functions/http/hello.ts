import * as functions from "firebase-functions";

const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello voxxrin logs!", {structuredData: true});
    response.send("Hello from Voxxrin!");
});

export default helloWorld
