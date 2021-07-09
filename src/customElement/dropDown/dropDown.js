class DropDownMenu extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: "open"});

        let linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../customElement/dropDown/style.css");
        this.shadow.appendChild(linkElem);

        let displayArea = document.createElement("div");
        displayArea.classList.add("display-area");
        this.displayArea = displayArea;

        let selectedValue = document.createElement("span");
        selectedValue.innerHTML = "Select a value";
        selectedValue.classList.add("selectedValue");
        this.selectedValue = selectedValue;

        let icon = document.createElement("span");
        icon.innerHTML = "+";
        icon.classList.add("icon");
        this.icon = icon;

        displayArea.appendChild(selectedValue);
        displayArea.appendChild(icon);
        this.shadow.appendChild(displayArea);

        let dropdown = document.createElement("div");
        dropdown.classList.add("drop-down", "invisible");
        this.dropDown = dropdown;
        this.isOpen = false;

        displayArea.addEventListener("click", (event) => {
            dropdown.classList.toggle("invisible");
            icon.classList.toggle("icon-close");

            if (this.isOpen == true) {
                event.stopPropagation();
            }

            setTimeout(() => {
                if (this.isOpen == true) {
                    this.isOpen = false;
                } else {
                    this.isOpen = true;
                }
            }, 80);
        });

        let listElement = document.createElement("div");
        listElement.classList.add("list-element");

        this.dropDownValues = [];

        document.addEventListener("click", () => {
            if (this.isOpen == true) {
                dropdown.classList.add("invisible");
                icon.classList.remove("icon-close");
                this.isOpen = false;
            }
        });

        this.listElement = listElement;
        dropdown.appendChild(listElement);
        this.shadow.appendChild(dropdown);

        window.addEventListener("resize", () => {
            setTimeout(() => {
                this.dropDown.style.width = this.displayArea.getBoundingClientRect().width + "px";
            }, 225);
        });

        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(() => {
                this.dropDown.style.width = this.displayArea.getBoundingClientRect().width + "px";
            }, 325);
        });
    }

    static get observedAttributes() {
        return ["input-list", "selected-value", "parameters", "disable"];
    }
      
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "input-list" && newValue != null) {
            let inputValues = newValue.split(";");

            this.listElement.innerHTML = "";
            this.dropDownValues = [];

            inputValues.forEach((value) => {
                let el = document.createElement("span");
                el.classList.add("drop-down-value");
                el.innerHTML = value;

                this.dropDownValues.push(el);

                el.addEventListener("click", (event) => {
                    this.setAttribute("selected-value", el.innerHTML);
                    this.dropDown.classList.toggle("invisible");
                    this.icon.classList.toggle("icon-close");
                    this.isOpen = false;
                    event.stopPropagation();
                });

                this.listElement.appendChild(el);
            });
            
            setTimeout(() => {
                this.dropDown.style.width = this.displayArea.getBoundingClientRect().width + "px";
            }, 265);
        } else if (name == "selected-value") {
            this.dropDownValues.forEach((el) => {
                el.classList.remove("drop-down-value-selected");
                if (el.innerHTML == newValue) {
                    el.classList.add("drop-down-value-selected");
                    this.dispatchEvent(new CustomEvent("update"), {
                        composed: true,
                        bubbles: true,
                    });
                }
            });
            this.selectedValue.innerText = newValue;
        } else if (name == "parameters") {
            this.parameters = newValue;

            this.dispatchEvent(new CustomEvent("parametersFound"), {
                composed: true,
                bubbles: true,
            });
        } else if(name == "disable") {
            if (newValue == "") {
                this.displayArea.classList.add("desactivate");
            } else {
                this.displayArea.classList.remove("desactivate");
            }
        }
    }
}

customElements.define("drop-down-menu", DropDownMenu);