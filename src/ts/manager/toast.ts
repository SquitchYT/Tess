export class Toaster {
    private target: Element
    private toasts: HTMLDivElement[] = [];

    constructor(target: Element) {
        this.target = target;
    }

    toast(title: string, message: string) {
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
            <svg class="icon" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M14.235 19c.865 0 1.322 1.024 .745 1.668a3.992 3.992 0 0 1 -2.98 1.332a3.992 3.992 0 0 1 -2.98 -1.332c-.552 -.616 -.158 -1.579 .634 -1.661l.11 -.006h4.471z" stroke-width="0" fill="currentColor"></path>
                <path d="M12 2c1.358 0 2.506 .903 2.875 2.141l.046 .171l.008 .043a8.013 8.013 0 0 1 4.024 6.069l.028 .287l.019 .289v2.931l.021 .136a3 3 0 0 0 1.143 1.847l.167 .117l.162 .099c.86 .487 .56 1.766 -.377 1.864l-.116 .006h-16c-1.028 0 -1.387 -1.364 -.493 -1.87a3 3 0 0 0 1.472 -2.063l.021 -.143l.001 -2.97a8 8 0 0 1 3.821 -6.454l.248 -.146l.01 -.043a3.003 3.003 0 0 1 2.562 -2.29l.182 -.017l.176 -.004z" stroke-width="0" fill="currentColor"></path>
            </svg>
        `;

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

        if (message != "") {
            toast.classList.add("with-text");

            toastMessage = document.createElement("span");
            toastMessage.classList.add("message");
            toastMessage.innerText = message;
            toastContent.appendChild(toastMessage);
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

        if (toastMessage && toastMessage.scrollWidth > toastMessage.clientWidth) {
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
            }, 139)
        }, 15000);

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