import tabIcon from "../../assets/default-tab.png";

export class Tab {
    element: HTMLElement;
    id: string;
    index: number;

    onClose: ((id: string) => void) | null = null;

    removedProgressTimeout1: number = 0;


    constructor(index: number, id: string, onClose:((id: string) => void)) {
        this.id = id;
        this.index = index;
        this.element = this.generateComponents();

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
        (this.element.querySelector(".title")! as HTMLSpanElement).innerText = title;
    }

    setProgress(value: number) {
        if (value > 0 && value < 100) {
            clearTimeout(this.removedProgressTimeout1);

            (this.element.querySelector(".progress")! as HTMLElement).style.animation = "tab-with-progress-added-progress-bar 100ms forwards";
            (this.element.querySelector(".progress")! as HTMLElement).style.animationDelay = "70ms";
            (this.element.querySelector(".title")! as HTMLElement).style.animation = "tab-with-progress-added-title 120ms forwards";
            (this.element.querySelector(".value")! as HTMLElement).style.width =  `${value}%`;
        } else {
            this.removedProgressTimeout1 = setTimeout(() => {
                (this.element.querySelector(".title")! as HTMLElement).style.animation = "tab-with-progress-removed-title 120ms forwards";
            }, 70);
            (this.element.querySelector(".progress")! as HTMLElement).style.animationDelay = "0ms";
            (this.element.querySelector(".progress")! as HTMLElement).style.animation = "tab-with-progress-removed-progress-bar 100ms forwards";
        }
    }

    private generateComponents() : HTMLElement {
        // TODO: Finish implementing this

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

        tab.appendChild(icon);
        tab.appendChild(title);
        tab.appendChild(closeButton);
        tab.appendChild(progress);

        return tab;
    }
}