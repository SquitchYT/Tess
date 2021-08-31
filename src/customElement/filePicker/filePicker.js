// eslint-disable-next-line no-global-assign
require = parent.require; // for get the good require function
try {
    // eslint-disable-next-line no-unused-vars
    const { ipcRenderer } = require("electron");
} catch {
    console.log("already imported");
}

class filePicker extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: "open"});

        let element = document.createElement("div");
        element.classList.add("element");

        let linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../customElement/filePicker/style.css");
        this.shadow.appendChild(linkElem);

        let displayArea = document.createElement("div");
        displayArea.classList.add("display-area");
        displayArea.innerText = "Click for select an icon";
        this.displayArea = displayArea;

        let editIcon = document.createElement("div");
        editIcon.classList.add("edit-icon");

        editIcon.innerHTML = `
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        `;

        element.appendChild(displayArea);
        element.appendChild(editIcon);
        this.shadow.appendChild(element);

        element.addEventListener("click", () => {
            // eslint-disable-next-line no-undef
            let path = ipcRenderer.sendSync("openFileDialog", {properties : ["openFile"]});
            if (path) {
                path = path.replace(/\\/g, "/");
                this.setAttribute("selected-value", path);
            }
        });
    }

    static get observedAttributes() {
        return ["selected-value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "selected-value" && newValue != null) {
            this.displayArea.innerText = newValue;
            this.dispatchEvent(new CustomEvent("update"), {
                composed: true,
                bubbles: true,
            });
        }
    }
}

customElements.define("file-picker", filePicker);