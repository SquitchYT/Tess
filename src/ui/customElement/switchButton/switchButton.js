class SwitchButton extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: "open"});

        let linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../customElement/switchButton/style.css");
        this.shadow.appendChild(linkElem);

        let button_div = document.createElement("div");

        let selector = document.createElement("div");
        selector.classList.add("selector", "selector-on");
        button_div.appendChild(selector);

        button_div.classList.add("button", "button-on");

        button_div.addEventListener("click", () => {
            if (this.getAttribute("state") == "true") {
                this.setAttribute("state", false);
            } else {
                this.setAttribute("state", true);
            }
        });

        this.buttonDiv = button_div;
        this.selector = selector;

        this.shadow.appendChild(button_div);
    }

    static get observedAttributes() {
        return ["state"];
    }
      
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "state") {
            if (newValue == "true") {
                this.buttonDiv.classList.remove("button-off");
                this.selector.classList.remove("selector-off");
            } else {
                this.buttonDiv.classList.add("button-off");
                this.selector.classList.add("selector-off");
            }

            this.dispatchEvent(new CustomEvent("updatedValue"), {
                composed: true,
                bubbles: true,
            });
        }
    }
}

customElements.define("switch-button", SwitchButton);