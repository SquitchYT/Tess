class ScrollerPicker extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });

        let linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "../../customElement/scroller-picker/style.css");
        this.shadow.appendChild(linkElem);

        let value = document.createElement("div");
        value.classList.add("value");
        this.shadow.appendChild(value);

        let maxIndicator = document.createElement("div");
        maxIndicator.classList.add("indicator");
        maxIndicator.innerHTML = "1";
        this.shadow.appendChild(maxIndicator);

        let minIndicator = document.createElement("div");
        minIndicator.classList.add("indicator");
        minIndicator.classList.add("min-indicator");
        minIndicator.innerHTML = "0";
        this.shadow.appendChild(minIndicator);

        this.maxIndicator = maxIndicator;
        this.minIndicator = minIndicator;
 
        let bar = document.createElement("div");
        bar.classList.add("bar");

        let progress = document.createElement("div");
        progress.classList.add("progress");

        this.progress = progress;

        this.callbackTimeout;
        this.hideValueTimeout;

        bar.addEventListener("mousedown", (e) => {
            progress.style.transition = "none";
            this.mouseDown = true;
            value.classList.add("visible");
            let dif = e.pageX - progress.getBoundingClientRect().right;
            progress.style.width = progress.getBoundingClientRect().width + dif + "px";
            value.style.transform = "translate(" + (progress.getBoundingClientRect().width - 20) + "px, -32px)";
            let pourcent = progress.getBoundingClientRect().width / bar.getBoundingClientRect().width;
            this.pourcent = pourcent;
            value.innerText = parseInt((pourcent * (this.max - this.min)).toFixed()) + parseInt(this.min);
            this.setAttribute("selected-value", parseInt((pourcent * (this.max - this.min)).toFixed()) + parseInt(this.min));

            this.dispatchEvent(new CustomEvent("update"), {
                composed: true,
                bubbles: true,
            });
        });

        bar.addEventListener("mouseenter", (_) => {
            value.style.transform = "translate(" + (progress.getBoundingClientRect().width - 20) + "px, -32px)";
            let pourcent = progress.getBoundingClientRect().width / bar.getBoundingClientRect().width;
            this.pourcent = pourcent;
            value.innerText = parseInt((pourcent * (this.max - this.min)).toFixed()) + parseInt(this.min);
            setTimeout(() => {
                value.classList.add("visible");
            }, 260)
        })

        bar.addEventListener("mouseleave", (_) => {
            this.hideValueTimeout = setTimeout(() => {
                value.classList.remove("visible");
            }, 160)
        })

        document.addEventListener("mousemove", (e) => {
            if (this.mouseDown == true) {
                clearTimeout(this.callbackTimeout);
                clearTimeout(this.hideValueTimeout);

                let dif = e.pageX - progress.getBoundingClientRect().right;
                progress.style.width = progress.getBoundingClientRect().width + dif + "px";
                value.style.transform = "translate(" + (progress.getBoundingClientRect().width - 20) + "px, -32px)";
                let pourcent = progress.getBoundingClientRect().width / bar.getBoundingClientRect().width;
                this.pourcent = pourcent;
                value.innerText = parseInt((pourcent * (this.max - this.min)).toFixed()) + parseInt(this.min);
                this.setAttribute("selected-value", parseInt((pourcent * (this.max - this.min)).toFixed()) + parseInt(this.min));
                
                this.callbackTimeout = setTimeout(() => {
                    this.dispatchEvent(new CustomEvent("update"), {
                        composed: true,
                        bubbles: true,
                    });
                }, 400)
            }
        });

        document.addEventListener("mouseup", () => {
            progress.style.transition = "all 450ms";
            this.mouseDown = false;
            value.classList.remove("visible");
        });

        bar.appendChild(progress);
        this.shadow.appendChild(bar);

        window.addEventListener("resize", () => {
            progress.style.transition = "all 450ms";
            progress.style.width = this.pourcent * (this.getBoundingClientRect().width) + "px";
            maxIndicator.style.transform = "translate(" + (this.getBoundingClientRect().width - maxIndicator.getBoundingClientRect().width / 2) + "px, -32px)";
        });
    }

    static get observedAttributes() {
        return ["min-value", "max-value", "suffix", "selected-value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "min-value" && newValue != null) {
            this.min = newValue;
        } else if (name == "max-value" && newValue != null) {
            this.max = newValue;
        } else if (name == "suffix" && newValue != null) {
            this.suffix = newValue;
            this.maxIndicator.innerHTML = String(this.max + this.suffix);
            this.minIndicator.innerHTML = String(this.min + this.suffix);
        } else if (name == "selected-value" && oldValue == null && newValue != null) {
            let pourcent = parseInt(newValue - this.min) / (this.max - this.min) * 100;
            this.pourcent = pourcent / 100;
            this.progress.style.width = pourcent + "%";
        }

        setTimeout(() => {
            this.maxIndicator.style.transform = "translate(" + (this.getBoundingClientRect().width - this.maxIndicator.getBoundingClientRect().width / 2) + "px, -32px)";
        }, 75)
    }
}

customElements.define("scroller-picker", ScrollerPicker);