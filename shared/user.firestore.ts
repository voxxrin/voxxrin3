import {ISODatetime} from "./type-utils";

export type UserTotalFavs = {
  total: number,
  perEventTotalFavs: Record<string, number>
}
export type UserTotalFeedbacks = {
  total: number,
  perEventTotalFeedbacks: Record<string, number>
}

export type User = {
    privateUserId: string,
    publicUserToken: string,
    userCreation: ISODatetime;
    userLastConnection?: ISODatetime|undefined;
    username: string;
    totalFavs: UserTotalFavs;
    totalFeedbacks: UserTotalFeedbacks;
    _version: 4;
    _modelRemainingMigrations: string[];
}

