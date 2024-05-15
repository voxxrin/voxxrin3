import {ISODatetime} from "./type-utils";

export type UserTotalFavs = {
  total: number,
  perEventTotalFavs: Record<string, number>
}

export type User = {
    privateUserId: string,
    publicUserToken: string,
    userCreation: ISODatetime;
    userLastConnection?: ISODatetime|undefined;
    username: string;
    totalFavs: UserTotalFavs;
    _version: 2
}

