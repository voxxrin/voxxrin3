import {ISODatetime} from "./type-utils";

export type UserTotalFavs = {
  total: number,
  perEventTotalFavs: Record<string, number>
}

export type User = {
    userCreation: ISODatetime;
    userLastConnection?: ISODatetime|undefined;
    username: string;
    totalFavs: UserTotalFavs;
    _version: 1
}

