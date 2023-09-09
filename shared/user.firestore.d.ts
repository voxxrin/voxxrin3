import {ISODatetime} from "./type-utils";

export type User = {
    userCreation: ISODatetime;
    userLastConnection: ISODatetime|undefined;
    username: string;
}

