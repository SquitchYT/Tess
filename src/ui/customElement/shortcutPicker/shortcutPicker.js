// eslint-disable-next-line no-global-assign
require = parent.require; // for get the good require function
try {
    // eslint-disable-next-line no-unused-vars
    const { ipcRenderer } = require("electron");
} catch {
    console.log("already imported");
}

class shortcutPicker extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: "open"});

        let linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../customElement/shortcutPicker/style.css");
        this.shadow.appendChild(linkElem);

        let shortcut = document.createElement("span");
        shortcut.innerText = "Click for choose a shortcut";
        this.shortcut = shortcut;

        let background = document.createElement("div");
        background.classList.add("background");
        this.background = background;

        background.addEventListener("click", () => {
            if (!this.underHandle && !this.desactivated) {
                shortcut.innerHTML = "Enter your shortcut";
                this.underHandle = true;
            }
        });

        this.shadow.appendChild(background);
        background.appendChild(shortcut);

        document.addEventListener("keyup", (e) => {
            if (this.underHandle && (e.keyCode > 64 && e.keyCode < 91)) {
                // eslint-disable-next-line no-undef
                ipcRenderer.send("shortcut", false);
                let shortcutString = "";
                if (e.ctrlKey) {
                    shortcutString += "CTRL + ";
                } if (e.altKey) {
                    shortcutString += "ALT + ";
                } if (e.shiftKey) {
                    shortcutString += "SHIFT + ";
                }
                shortcutString += (e.key).toUpperCase();
                this.setAttribute("selected-value", shortcutString);
    
                setTimeout(() => {
                    // eslint-disable-next-line no-undef
                    ipcRenderer.send("shortcut", true);
                }, 100);
                this.underHandle = false;
            }
        });
    }

    static get observedAttributes() {
        return ["selected-value", "disable"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "selected-value" && newValue != null) {
            this.shortcut.innerText = newValue;
        } else if(name == "disable") {
            if (newValue == "") {
                this.background.classList.add("desactivate");
            } else {
                this.background.classList.remove("desactivate");
            }
        }
    }
}

customElements.define("shortcut-picker", shortcutPicker);