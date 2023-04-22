import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {MarvelCharacter} from "./types";

@customElement('marvel-character')
class MarvelCharacterElement extends LitElement {
    @property()
    private character: MarvelCharacter;

    static styles = [
        css`
          li {
            border: 1px solid black;
            padding: 10px 20px 10px 20px;

            display: grid;
            grid-auto-flow: row dense;
            grid-template-columns: 150px 15px 1fr;
            grid-template-rows: 1fr 1fr 4fr;
            gap: 0px 0px;
            grid-template-areas: 
    "picture . id"
    "picture . name"
    "picture . description";
            min-height: 150px;
          }
          li:hover {
            background-color: lightgrey;
            cursor: pointer;
          }
          .picture { grid-area: picture; align-self: center; justify-self: center; }
          .description { grid-area: description; }
          .name { grid-area: name; min-height: 30px; }
          .id { grid-area: id; min-height: 30px; }
          
          label { font-weight: bold; }
          img { max-width: 150px; max-height: 150px; }
        `
    ]
    protected render(): unknown {
        return html`
          <li @click="${(event => alert(this.character.name))}">
            <div class="picture">
              <img src="${this.character.thumbnail.path}.${this.character.thumbnail.extension}" />
            </div>
            <div class="id"><label>ID</label>: ${this.character.id}</div>
            <div class="name"><label>Name</label>: ${this.character.name}</div>
            <div class="description"><label>Description</label>: ${this.character.description}</div>
          </li>
        `
    }
}
