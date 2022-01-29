// eslint-disable-next-line no-global-assign
require = parent.require; // for get the good require function

const name_to_define = require("../../../utils/osinfo");
const systemData = new name_to_define();

class TitleBarButton extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: "open"});

        if (systemData.os == "win32") {
            let a = document.createElement("div");
            a.classList.add('background');
            a.style.width = "156px";
            this.shadow.appendChild(a);
        }

        if (systemData.supportCustomTitleBar) {
            let linkElem = document.createElement("link");
            linkElem.setAttribute("rel", "stylesheet");
            linkElem.setAttribute("href", "../../customElement/titleBarButton/style.css");
            this.shadow.appendChild(linkElem);

            if (systemData.wm == "KDE") {
                linkElem = document.createElement("link");
                linkElem.setAttribute("rel", "stylesheet");
                linkElem.setAttribute("href", "../../customElement/titleBarButton/KDE-titlebar.css");
                this.shadow.appendChild(linkElem);
            }

            let a = document.createElement("div");
            a.classList.add('background');
            
            a.appendChild(systemData.closeTitleBarButton)
            a.appendChild(systemData.expandTitleBarButton)
            a.appendChild(systemData.minimizeTitleBarButton)

            this.shadow.appendChild(a);
        }
    }
}

customElements.define("title-bar-button", TitleBarButton);