import { Terminal } from "./terminal";
import { PagePane, TerminalPane } from "./panes";

export class View {
    // TODO: Implement pane page type

    id: string | undefined;
    element: HTMLElement | undefined;

    panes: (TerminalPane|PagePane)[] = []

    closedEvent: ((id: string) => void) | undefined;

    // TODO: Replace with 2 fucntion overloaded
    // TODO: Add close eveent from view manager
    async buildNew(viewId: string, initialPane: "terminal" | "page", paneId: string, terminalCommand: string, closedEvent: ((id: string) => void)) {
        this.id = viewId;
        this.element = this.generateComponents();
        this.closedEvent = closedEvent;

        switch (initialPane) {
            case "terminal": {
                let pane = new TerminalPane(paneId);

                await pane.initializeTerm(terminalCommand);

                this.panes.push(pane)
                this.element.appendChild(pane.element);

                break;
            }
            case "page": {
                // TODO: Implement

                this.panes.push(new PagePane(paneId));

                break;
            }
        }
    }

    private generateComponents() : HTMLElement {
        let view = document.createElement("div");
        view.classList.add("view");

        return view
    }

    /*openPane(split: "horizontaly" | "vertically", paneId: string, subviewToSplit: string) {
        // TODO: Implement
    }*/

    async closeAll() {
        for await (let pane of this.panes) {
            await pane.close();
            this.panes.splice(this.panes.indexOf(pane), 1);

            this.element!.removeChild(pane.element!)
        }

        this.element!.remove();
    }

    async closeOne(id: string) {
        let pane = this.panes.find((pane) => pane.id == id);

        if (pane) {
            await pane.close()
            this.panes.splice(this.panes.indexOf(pane), 1);
        } else {
            // TODO: Handle error
        }

        if (this.panes.length == 0) {
            this.closedEvent!(this.id!);
        }

        // TODO: Implement
    }

    writeToTerm(termId: string, data: string) {
        let pane = this.panes.find((pane) => pane.id == termId)

        if (pane && pane instanceof TerminalPane) {
            pane.write(data)
        }
    }

    getTerm(id: string) : Terminal | undefined {
        return this.panes.find((pane) => pane.id == id && pane instanceof TerminalPane) ? (this.panes.find((pane) => pane.id == id && pane instanceof TerminalPane) as TerminalPane).term! : undefined
    }

    focus() {
        // TODO: Finish
        // TODO: Restore focus to last pane with focus before unfocusing

        this.element!.classList.add("visible");

        this.panes.forEach((pane) => {
            pane.focus();
        })
    }

    unfocus() {
        // TODO: Implement
        // TODO: Save last pane with focus

        this.element!.classList.remove("visible");

        this.panes.forEach((pane) => {
            pane.unfocus();
        })
    }
}