// Stolen from https://stackoverflow.com/a/39597017
export const PARSE_CSS_LIST = /,(?=(?:(?:[^"']*"[^"']*")|(?:[^'"]*'[^'"]*'))*[^"']*$)/g

export function parseCSSList(value) {
  if(typeof value !== 'string'){
    return [];
  }
  return value
      .replaceAll(PARSE_CSS_LIST, String.fromCodePoint(0))
      .replace(/;/, '')
      .split(String.fromCodePoint(0))
}

export const COLOR_PARSE_REGEX = /((^[\w]+$)|(^\#[a-f\d]{3,6}$))/i

export function parseSimpleColor(colorString, def = undefined) {
  return COLOR_PARSE_REGEX.test(colorString) ? colorString : def
}

/**
 *
 * @param {string} elementName
 * @param {HTMLElement} nativeElement
 * @param {object} options
 * @returns {HTMLElement}
 */
export function geoExtendElement(elementName, nativeElement = HTMLElement, options = {}) {

  const {attrs, noSlot} = options

  return class extends nativeElement {

    #jj;
    #refs;
    #attrs;
    #styleElement;
    #slotElement;

    constructor(...args) {
      super(...args)
      this.attachShadow({mode: 'open'})


      this.#jj = new Proxy(() => {
      }, {
        get(obj, prop) {
          if (prop in obj) return Reflect.get(...arguments)
          if (prop === 'fragment') return new DocumentFragment()
          return document.createElement(prop)
        },
        apply: (obj, that, args) => {
          return this.shadowRoot.querySelectorAll(...args)
        },
      })

      this.#refs = new Proxy({}, {
        get: (obj, prop) => {
          if (prop in obj) return Reflect.get(...arguments)
          return this.shadowRoot.querySelectorAll(`[ref="${prop}"]`)
        },
      })

      this.#attrs = new Proxy({}, {
        get:(obj, prop) =>{
          if (prop in obj) return Reflect.get(...arguments)
          if(Array.isArray(attrs) && attrs.includes(prop)){
            return this.getAttribute(prop);
          }
          if(typeof attrs === 'object' && prop in attrs){
            return this.getAttribute(prop) || attrs[prop];
          }
          return undefined;
        }
      })

      this.#slotElement = this.jj.slot;

      this.#styleElement = this.jj.style;
      this.shadowRoot.append(this.#styleElement);
      if(!noSlot){
        this.shadowRoot.append(this.#slotElement);
      }

    }

    get slotElement(){
      return this.#slotElement;
    }

    get styleElement(){
      return this.#styleElement;
    }

    css(stringParts, ...valueParts){
      const style = stringParts.reduce((acc, el, index)=>{
        return acc+el + (valueParts[index]||'');
      },'');
      this.#styleElement.textContent = style;
      return this.#styleElement;
    }

    get jj() {
      return this.#jj
    }

    get attrs(){
      return this.#attrs;
    }

    get refs() {
      return this.#refs
    }

    cE(...args) {
      return document.createElement(...args)
    }

    static register(customName) {
      return customElements.define(customName || elementName, this, {extends: options.extends})
    }

    static get observedAttributes() {
      if(Array.isArray(attrs)) return attrs;
      return Object.keys(attrs);
    }

    /**
     *
     * @param {Object<String,String>} values
     * @param {String} styles
     */
    __templateStyle(values, styles) {
      return Object.keys(values).reduce((output, input) => {
        return output.replaceAll(`--templateStyle-${input}`, values[input])
      }, styles)
    }
  }
}
