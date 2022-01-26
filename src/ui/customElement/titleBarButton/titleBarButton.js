// eslint-disable-next-line no-global-assign
require = parent.require; // for get the good require function

const name_to_define = require("../../../utils/osinfo");
const systemData = new name_to_define();

class TitleBarButton extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: "open"});

        let linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../customElement/titleBarButton/style.css");
        this.shadow.appendChild(linkElem);

        let a = document.createElement("div");
        a.classList.add('background');
        a.style.width = systemData.titleBarButtonsWidth() + "px";

        this.shadow.appendChild(a);
        
    }
}

customElements.define("title-bar-button", TitleBarButton);