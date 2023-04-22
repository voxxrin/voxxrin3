import { SplashScreen } from '@capacitor/splash-screen';
import {Camera, Photo} from '@capacitor/camera';
import {CameraResultType} from "@capacitor/camera/dist/esm/definitions";
import {css, html, LitElement} from "lit";
import {customElement, property, query, state} from 'lit/decorators.js';
import MARVEL_CHARS from '../data/marvel-characters.json'
import {MarvelCharacter} from "./types";
import "@lit-labs/virtualizer"
import {virtualize} from "@lit-labs/virtualizer/virtualize.js";

@customElement('capacitor-welcome')
class CapacitorWelcome extends LitElement {

    @state()
    private photo: Photo|undefined = undefined;

    @state()
    private marvelCharacters: MarvelCharacter[];

    static styles = [
        css`
  :host {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    display: block;
    width: 100%;
    height: 100%;
  }
  h1, h2, h3, h4, h5 {
    text-transform: uppercase;
  }
  .button {
    display: inline-block;
    padding: 10px;
    background-color: #73B5F6;
    color: #fff;
    font-size: 0.9em;
    border: 0;
    border-radius: 3px;
    text-decoration: none;
    cursor: pointer;
  }
  main {
    padding: 15px;
  }
  main hr { height: 1px; background-color: #eee; border: 0; }
  main h1 {
    font-size: 1.4em;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  main h2 {
    font-size: 1.1em;
  }
  main h3 {
    font-size: 0.9em;
  }
  main p {
    color: #333;
  }
  main pre {
    white-space: pre-line;
  }
  ul {
    list-style: none;
    margin: 0px;
    padding: 0px;
  }
        `
    ]

    constructor() {
        super();

        this.marvelCharacters = MARVEL_CHARS;
    }

    protected render(): unknown {
        SplashScreen.hide();

        return html`
            <div>
              <capacitor-welcome-titlebar>
                <h1>Capacitor</h1>
              </capacitor-welcome-titlebar>
              <main>
                <p>
                  Capacitor makes it easy to build powerful apps for the app stores, mobile web (Progressive Web Apps), and desktop, all
                  with a single code base.
                </p>
                <h2>Getting Started</h2>
                <p>
                  You'll probably need a UI framework to build a full-featured app. Might we recommend
                  <a target="_blank" href="http://ionicframework.com/">Ionic</a>?
                </p>
                <p>
                  Visit <a href="https://capacitorjs.com">capacitorjs.com</a> for information
                  on using native features, building plugins, and more.
                </p>
                <a href="https://capacitorjs.com" target="_blank" class="button">Read more</a>
                <h2>Tiny Demo</h2>
                <p>
                  This demo shows how to call Capacitor plugins. Say cheese!
                </p>
                <p>
                  <button class="button" id="take-photo" @click="${event => this.takePhoto()}">Take Photo</button>
                </p>
                <p>
                  <img id="image" style="max-width: 100%" src="${this.photo?.webPath}">
                </p>
                
                <ul style="width: 100%">
                  ${virtualize({
                    items: this.marvelCharacters,
                    renderItem: mc => html`
                        <marvel-character .character="${mc}"></marvel-character>
                    `
                  })}
                </ul>
              </main>
            </div>
        `
    }

    private async takePhoto() {
        try {
            this.photo = await Camera.getPhoto({
                resultType: CameraResultType.Uri,
            });
        } catch (e) {
            console.warn('User cancelled', e);
        }
    }
}

@customElement('capacitor-welcome-titlebar')
class CapacitorWelcomeTitlebar extends LitElement {
    static styles = [
        css`
          :host {
            position: relative;
            display: block;
            padding: 15px 15px 15px 15px;
            text-align: center;
            background-color: #73B5F6;
          }
          ::slotted(h1) {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            font-size: 0.9em;
            font-weight: 600;
            color: #fff;
          }
        `
    ]

    protected render(): unknown {
        return html`
          <slot></slot>
        `
    }
}
