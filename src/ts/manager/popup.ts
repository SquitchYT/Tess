import { PopupBuilder, PopupResult } from "../class/popup";

export class PopupManager {
    waitingQueue: [PopupBuilder, HTMLElement, (value: unknown) => void][] = [];
    usedTarget: HTMLElement[] = [];

    sendPopup(popupBuilder: PopupBuilder, target: HTMLElement = document.body) : Promise<PopupResult> {
        return new Promise(async (resolve, _) => {
            if (this.usedTarget.find((registredTarget) => registredTarget == target)) {
                await new Promise((resolve, _) => {
                    this.waitingQueue.push([popupBuilder, target, resolve]);
                })
            } else {
                this.usedTarget.push(target)
            }

            let currentFocusedElement = document.activeElement;

            let popupBuilt = popupBuilder.build((action, doNotShowAgain) => {
                popupBuilt.style.animation = "popup-removed-background-fade 140ms forwards";
                (popupBuilt.querySelector(".inner") as HTMLElement).style.animation = "popup-removed 140ms forwards";

                (currentFocusedElement as HTMLElement).focus();
            
                setTimeout(() => {
                    target.removeChild(popupBuilt)
                    this.popupClosed(target)
                }, 140)
                resolve({
                    action: action,
                    doNotShowAgain: doNotShowAgain
                })
            });

            popupBuilt.addEventListener("keydown", (e) => {
                if (target == document.body) { e.stopImmediatePropagation(); }
                e.preventDefault();

                let focusableElements = popupBuilt.querySelectorAll("[tabindex]");
                let firstElement = focusableElements[0];
                let lastElement = focusableElements[focusableElements.length - 1];

                if (e.key == "Tab" || e.keyCode == 9) {
                    if (document.activeElement == popupBuilt) {
                        (firstElement as HTMLElement).focus();
                    } else if (e.shiftKey && document.activeElement == firstElement) {
                        (lastElement as HTMLElement).focus();
                    } else if (!e.shiftKey && document.activeElement == lastElement) {
                        (firstElement as HTMLElement).focus();
                    } else {
                        (focusableElements[Array.prototype.indexOf.call(focusableElements, document.activeElement) + (e.shiftKey ? -1 : 1)] as HTMLElement).focus();
                    }
                } else if (e.key == "Enter") {
                    (document.activeElement as HTMLElement).click();
                }              
            });

            popupBuilt.style.animation = "popup-added-background-fade 140ms forwards";
            (popupBuilt.querySelector(".inner") as HTMLElement).style.animation = "popup-added 140ms forwards";

            setTimeout(() => {
                popupBuilt.style.animation = "";
                (popupBuilt.querySelector(".inner") as HTMLElement).style.animation = "";
            }, 140)

            popupBuilt.setAttribute("tabindex", "0");
            target.appendChild(popupBuilt);
            popupBuilt.focus();
        })
    }

    private popupClosed(target: HTMLElement) {
        let waitingPopup = this.waitingQueue.find((item) => item[1] == target);
        if (waitingPopup) {
            this.waitingQueue.splice(this.waitingQueue.indexOf(waitingPopup), 1)
            waitingPopup[2](null);
        } else {
            this.usedTarget.splice(this.usedTarget.indexOf(target), 1)
        }
    }
}