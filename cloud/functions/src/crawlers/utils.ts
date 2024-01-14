import axios from "axios";

const STD_HEADERS = {
  Connection: 'keep-alive',
  'Keep-Alive': 'timeout=1500, max=100'
}

export const http = Object.freeze({
  async get<T extends unknown>(url: string): Promise<T> {
    const res = (await axios.get(url, { headers: STD_HEADERS })).data
    if(typeof res !== 'object') {
      throw Error(`Unexpected http.get() result type (${typeof res}) for URL call ${url}: ${res}`)
    }
    return res;
  },
  async maybeGet<T extends unknown>(url: string): Promise<T|undefined> {
    const res = (await axios.get(url, { headers: STD_HEADERS }))?.data
    if(typeof res !== 'object' && typeof res !== 'undefined') {
      throw Error(`Unexpected http.maybeGet() result type (${typeof res}) for URL call ${url}: ${res}`)
    }
    return res;
  },
  async getAsText(url: string): Promise<string> {
    return (await axios.get(url, { headers: STD_HEADERS, responseType: 'text' })).data
  },

  async post<T extends unknown>(url: string, payload: object): Promise<T> {
    const res = (await axios.post(url, payload, { headers: STD_HEADERS })).data
    if(typeof res !== 'object') {
      throw Error(`Unexpected http.post() result type (${typeof res}) for URL call ${url}: ${res}`)
    }
    return res;
  },

  async put<T extends unknown>(url: string, payload: object): Promise<T> {
    const res = (await axios.put(url, payload, { headers: STD_HEADERS })).data
    if(typeof res !== 'object') {
      throw Error(`Unexpected http.put() result type (${typeof res}) for URL call ${url}: ${res}`)
    }
    return res;
  },

})
