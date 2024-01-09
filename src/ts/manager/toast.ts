export class Toaster {
    private target: Element
    private toasts: HTMLDivElement[] = [];

    constructor(target: Element) {
        this.target = target;
    }

    toast(title: string, message?: string, type: "info" | "warning" | "error" = "info") {
        let toast = document.createElement("div");
        toast.classList.add("toast");

        let toastContent = document.createElement("div");
        toastContent.classList.add("content")

        let toastTitle = document.createElement("span");
        toastTitle.classList.add("title");
        toastTitle.innerText = title;

        let toastIcon = document.createElement("div");
        toastIcon.classList.add("icon");

        switch (type) {
            case "error":
                toastIcon.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
              `;
                break
            case "warning":
                toastIcon.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>`;
                break
            default:
                toastIcon.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              `;
        }

        toastContent.appendChild(toastTitle);

        let toastActions = document.createElement("div");
        toastActions.classList.add("actions");

        let dismissToastButton = document.createElement("div");
        dismissToastButton.classList.add("close");

        dismissToastButton.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        `;

        toastActions.appendChild(dismissToastButton);

        let toastMessage;
        if (message) {
            toast.classList.add("with-text");

            let toastMessageWrapper = document.createElement("div");

            toastMessage = document.createElement("span");
            toastMessageWrapper.classList.add("message");
            toastMessage.innerText = message;

            toastMessageWrapper.appendChild(toastMessage)

            toastContent.appendChild(toastMessageWrapper);
        }

        toast.appendChild(toastIcon);
        toast.appendChild(toastContent);
        toast.appendChild(toastActions);

        this.toasts.forEach((toast) => {
            toast.style.animation = "";
            toast.offsetHeight;
            toast.style.animation = "toast-slide-up 140ms forwards";
        })

        this.target.appendChild(toast);

        this.toasts.push(toast);

        if (toastMessage && toastMessage.scrollHeight > toastMessage.clientHeight) {
            let expandToastButton = document.createElement("div");
            expandToastButton.classList.add("expand");
            expandToastButton.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            `;

            toastActions.appendChild(expandToastButton);

            expandToastButton.addEventListener("click", () => {
                toast.classList.toggle("text-expanded")
            })
        }

        let closeTimeout = setTimeout(() => {
            toast.style.animation = "toast-removed 140ms forwards";

            this.toasts.splice(this.toasts.indexOf(toast), 1);

            setTimeout(() => {
                toast.remove()
            }, 140)
        }, 20000);

        dismissToastButton.addEventListener("click", () => {
            clearTimeout(closeTimeout);

            toast.style.animation = "toast-removed 140ms forwards";

            let toastsToSlideDown = this.toasts.slice(0, this.toasts.indexOf(toast))
            this.toasts.splice(this.toasts.indexOf(toast), 1);

            setTimeout(() => {
                toast.remove()

                toastsToSlideDown.forEach((toast) => {
                    toast.style.animation = "";
                    toast.offsetHeight;
                    toast.style.animation = "toast-slide-down 140ms forwards";
                })
            }, 139)
        })
    }
}