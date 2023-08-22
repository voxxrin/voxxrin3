import * as functions from "firebase-functions";
import {sendResponseMessage} from "./utils";

const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello voxxrin logs!", {structuredData: true});
    return sendResponseMessage(response, 200, "Hello from Voxxrin!");
});

export default helloWorld
