// eslint-disable-next-line no-global-assign
require = parent.require; // for get the good require function

const name_to_define = require("../../../utils/osinfo");
const systemData = new name_to_define();

class TitleBarButton extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: "open"});

        let a = document.createElement("div");
        a.classList.add('background');

        if (systemData.os == "win32") {
            a.style.width = "156px";
        } else {
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
                } else if (systemData.wm == "X-Cinnamon" || systemData.wm == "Budgie:GNOME") {
                    linkElem = document.createElement("link");
                    linkElem.setAttribute("rel", "stylesheet");
                    linkElem.setAttribute("href", "../../customElement/titleBarButton/cinnamon-titlebar.css");
                    this.shadow.appendChild(linkElem);
                }
                
                let test = systemData.titleBarButtonOrder
                for (let index = 0; index < test.length; index+=2) {
                    if (test[index] == "r") {
                        switch (test[index+1]) {
                            case "c":
                                a.appendChild(systemData.closeTitleBarButton);
                                break;
                            case "m":
                                a.appendChild(systemData.expandTitleBarButton);
                                break;
                            case "r":
                                a.appendChild(systemData.minimizeTitleBarButton);
                                break;
                        }
                    }
                    
                }
            }
        }

        this.shadow.appendChild(a);
    }
}

customElements.define("title-bar-button", TitleBarButton);