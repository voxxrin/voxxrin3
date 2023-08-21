import {isPlatform} from "@ionic/vue";


export function getPlatform(): "android"|"ios"|"web" {
    if(isPlatform("ios")) {
        return "ios";
    } else if(isPlatform("android")) {
        return "android";
    } else {
        return "web";
    }
}
