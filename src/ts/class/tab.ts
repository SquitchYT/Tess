import tabIcon from "../../assets/default-tab.png";
import "xterm/css/xterm.css";

export class Tab {
    element: HTMLElement;
    id: string;
    index: number;

    onClose: ((id: string) => void) | null = null;

    removedProgressTimeout: number = 0;

    title: string = "";


    constructor(index: number, id: string, onClose:((id: string) => void)) {
        this.id = id;
        this.index = index;
        this.element = this.generateComponents();

        this.setTitle("");

        new ResizeObserver(() => {
            if (this.element.clientWidth <= 34) {
                this.element.classList.add("small")
            } else {
                this.element.classList.remove("small")
            }
        }).observe(this.element)

        this.onClose = onClose;
    }

    setTitle(title: string) {
        this.title = title;
        (this.element.querySelector(".title")! as HTMLSpanElement).innerText = title != "" ? title : "Untitled tab";
    }

    setProgress(value: number) {
        if (value > 0 && value < 100) {
            clearTimeout(this.removedProgressTimeout);

            (this.element.querySelector(".progress")! as HTMLElement).style.animation = "tab-with-progress-added-progress-bar 100ms forwards";
            (this.element.querySelector(".progress")! as HTMLElement).style.animationDelay = "70ms";
            (this.element.querySelector(".title")! as HTMLElement).style.animation = "tab-with-progress-added-title 120ms forwards";
            (this.element.querySelector(".value")! as HTMLElement).style.width =  `${value}%`;
        } else {
            this.removedProgressTimeout = setTimeout(() => {
                (this.element.querySelector(".title")! as HTMLElement).style.animation = "tab-with-progress-removed-title 120ms forwards";
            }, 70);
            (this.element.querySelector(".progress")! as HTMLElement).style.animationDelay = "0ms";
            (this.element.querySelector(".progress")! as HTMLElement).style.animation = "tab-with-progress-removed-progress-bar 100ms forwards";
        }
    }

    setHighlight(visible: boolean) {
        (this.element.querySelector(".ping")! as HTMLElement).classList.toggle("hidden", !visible);
    }

    private generateComponents() : HTMLElement {
        let tab = document.createElement("div");

        let title = document.createElement("span");
        title.classList.add("title")

        let closeButton = document.createElement("div");
        closeButton.classList.add("close");

        closeButton.innerHTML = `
        <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
        `;

        closeButton.addEventListener("click", () => {
            this.onClose!(this.id);
        })

        let icon = document.createElement("div");
        let img = document.createElement("img");

        img.src = tabIcon;

        icon.classList.add("icon")
        icon.appendChild(img)

        let progress = document.createElement("div");
        let progressValue = document.createElement("div");
        progressValue.classList.add("value");

        progress.classList.add("progress");
        progress.appendChild(progressValue)

        let pingMark = document.createElement("div");
        pingMark.classList.add("ping", "hidden");

        tab.appendChild(icon);
        tab.appendChild(title);
        tab.appendChild(closeButton);
        tab.appendChild(progress);
        tab.appendChild(pingMark);

        return tab;
    }
}