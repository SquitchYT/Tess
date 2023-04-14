export class Toaster {
    private target: Element

    constructor(target: Element) {
        // TODO: Implement

        this.target = target;
    }

    toast(title: string, message: string) {
        // TODO: Support message parameter

        let toast = document.createElement("div");
        toast.classList.add("toast");

        let toastContent = document.createElement("div");
        toastContent.classList.add("content")

        let toastTitle = document.createElement("span");
        toastTitle.classList.add("title");
        toastTitle.innerText = title;

        let toastIcon = document.createElement("div");
        toastIcon.classList.add("icon")
        toastIcon.innerHTML = `
            <svg viewBox="0 0 24 24" stroke-width="2.4" stroke="currentColor" class="icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        `;

        toastContent.appendChild(toastTitle);

        toast.appendChild(toastIcon);
        toast.appendChild(toastContent);

        this.target.appendChild(toast);
    }

    toastError(title: string, message: string) {
        // TODO: Implement
    }
}