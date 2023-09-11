import { TabsManager } from "./tabs";
import { listen, Event } from '@tauri-apps/api/event'
import { v4 as uuid } from 'uuid';
import { invoke } from '@tauri-apps/api/tauri'

import { terminalDataPayload, terminalTitleChangedPayload } from "../schema/term";
import { View } from "../class/views";
import { Toaster } from "./toast";

import { Option, ShortcutAction } from "ts/schema/option";
import { PopupManager } from "./popup";
import { TerminalPane } from "ts/class/panes";
import { ShortcutsManager } from "./shortcuts";
import { clipboard } from "@tauri-apps/api";
import { PopupBuilder, PopupButton } from "../class/popup";


export class ViewsManager {
    // TODO: Finish

    private target: Element;

    private tabsManager: TabsManager;
    private popupManager: PopupManager;
    private shortcutsManager: ShortcutsManager

    option: Option;

    private views: View[] = [];

    private toaster: Toaster;

    private focusedView: View | undefined;

    constructor(target: Element, tabsTarget: Element, toastTarget: Element, option: Option) {
        this.target = target;

        this.tabsManager = new TabsManager(tabsTarget, (id) => { this.onTabRequestClose(id); });
        this.tabsManager.addEventListener("tabFocused", (id) => { this.onTabFocused(id); });
        this.popupManager = new PopupManager();

        this.shortcutsManager = new ShortcutsManager(option.shortcuts, (action) => { this.onShortcutExecuted(action) });

        listen<terminalDataPayload>("terminalData", (e) => { this.onTerminalReceiveData(e); });
        listen<terminalTitleChangedPayload>("terminalTitleChanged", (e) => { this.onTerminalTitleChanged(e); })
        listen<string>("terminal_closed", (e) => { this.onTerminalProcessExited(e); });

        listen("request_window_closing", () => { this.closeViews(); })

        this.toaster = new Toaster(toastTarget);

        this.option = option;
    }

    private onTabFocused(id: string) {
        let viewToFocus = this.views.find((view) => view.id! == id);

        if (viewToFocus) {
            this.focusedView = viewToFocus;

            viewToFocus.focus();

            this.views.forEach((view) => {
                if (view.id != id) {
                    view.unfocus();
                }
            })
        } else {
            // TODO: Handle unknown view and close the tab
        }
    }

    private onTabRequestClose(id: string) {
        let view = this.views.find((view) => view.id == id);
        if (view) {
            view.requestClosingAll()
        } else {
            this.toaster.toast("Orphaned tab", "It looks like this tab is orphaned.")
        }
    }

    private onViewsClosed(uuid: string) {
        let view = this.views.find((view) => view.id == uuid);
        if (view) {
            view.element!.remove();
            this.views.splice(this.views.indexOf(view), 1);
            if (this.views.length == 0) {
                invoke("close_window")
            }
        }

        this.tabsManager.closeTab(uuid);
    }

    private onTerminalReceiveData(e: Event<terminalDataPayload>) {
        this.views.forEach((view) => {
            let term = view.getTerm(e.payload.id);
            if (term) {
                term.term.write(e.payload.data);
            }
        })
    }

    private onTerminalTitleChanged(e: Event<terminalTitleChangedPayload>) {
        this.views.forEach((view) => {
            if (view.getTerm(e.payload.id)) {
                view.updatePaneTitle(e.payload.id, e.payload.title)
            }
        })
    }

    private onTerminalPaneInput(id: string, data: string) {
        invoke("terminal_input", {content: data, id: id});
    }

    private onTerminalProcessExited(e: Event<String>) {
        this.views.forEach((view) => {
            view.panes.forEach((pane) => {
                if (pane.id == e.payload) {
                    this.closeViewPane(view.id!, pane.id);
                }
            })
        });
    }

    private async onShortcutExecuted(action: ShortcutAction) {
        if (Array.isArray(action)) {
            switch (action[0]) {
                case "focusTab":
                    this.tabsManager.select(action[1]);
                    break;
                case "openProfile":
                    this.openProfile(action[1], true);
                    break;
                case "executeMacro":
                    let macro = this.option.macros.find(macro => macro.uuid == action[1]);
                    if (macro) {
                        invoke("terminal_input", {content: macro.content, id: this.focusedView!.focusedPane!.id});
                    }
                    break;
                default:
                    this.toaster.toast("Shortcut error", action[0] + " is not yet implemented");
            }
        } else {
            switch (action) {
                case "copy":
                    clipboard.writeText((this.focusedView!.focusedPane! as TerminalPane).term!.term.getSelection());
                    break;
                case "paste":
                    let clipboardContent = await clipboard.readText();
                    if (clipboardContent) {
                        invoke("terminal_input", {content: clipboardContent, id: this.focusedView!.focusedPane!.id});
                    }
                    break;
                case "openDefaultProfile":
                    this.openProfile(this.option.defaultProfile.uuid, true);
                    break;
                case "closeFocusedTab":
                    this.tabsManager.requestTabClosing(this.tabsManager.getSelected().id);
                    break;
                case "focusNextTab":
                    this.tabsManager.selectNext();
                    break;
                case "focusPrevTab":
                    this.tabsManager.selectPrevious();
                    break;
                case "focusFirstTab":
                    this.tabsManager.selectFirst();
                    break;
                case "focusLastTab":
                    this.tabsManager.selectLast();
                    break;
                case 'closeAllTabs':
                    this.closeViews()
                    break;
                default:
                    this.toaster.toast("Shortcut error", action + " is not yet implemented");
            }
        }
    }

    private async closeViews() {
        if (this.views.length == 1) {
            this.tabsManager.requestTabClosing(this.views[0].id!)
        } else {
            let confirmButton = new PopupButton("confirm", "validate");
            let cancelButton = new PopupButton("cancel", "dismiss");

            let popupResult = await this.popupManager.sendPopup(new PopupBuilder(`Confirm close of ${this.views.length} tabs`).withMessage(`Are you sure to close this window?`).withButtons(confirmButton, cancelButton));
            if (popupResult.action == "confirm") {
                for await (let view of this.views) {
                    await view.closeAll()
                }

                invoke("close_window");
            }
        }
    }

    openProfile(profileId: string, focus: boolean) {
        let viewId = uuid();
        let paneId = uuid();

        let profile = this.option.profiles.find(profile => profile.uuid == profileId);
        if (profile) {
            let view = new View(viewId, this.popupManager, (id) => { this.onViewsClosed(id); }, (title) => { this.tabsManager.setTitle(viewId, title); })
            
            view.openPane(paneId, profile, (e, term) => { return this.shortcutsManager.onKeyPress(e, term); }).then(() => {
                this.views.push(view);
                this.target.appendChild(view.element!);
    
                view.getTerm(paneId)!.term.onData((content, _) => {
                    this.onTerminalPaneInput(paneId, content);
                });
    
                this.tabsManager.openNewTab(profile!.name, viewId);
    
                if (focus) { this.tabsManager.select(viewId); }
            }).catch((err) => {
                this.toaster.toast("Unable to create view",  err);
            })
        } else {
            this.toaster.toast("Unable to create view", `An error occur while opening a view. Reason: no profile corresponding to id ${profileId}`);
        }
    }

    closeViewPane(viewId: string, paneId: string) {
        let view = this.views.find((view) => view.id == viewId);

        if (view) {
            view.requestClosingOne(paneId).catch((err) => {
                this.toaster.toast("Unable to close a view's pane",  err);
            })
        } else {
            // TODO: Handle error
        }
    }


    /*openInternalPage(pageName: string) {
        // TODO: Implement
    }

    openPluginPage(pageName: string) {
        // TODO: Implement
    }

    openProfileInView(profileId: string, viewId: string, split: "horizontaly" | "verticaly") {
        // TODO: Implement
    }

    openInternalPageInView(pageName: string, viewId: string, split: "horizontaly" | "verticaly") {
        // TODO: Implement
    }

    openPluginPageInView(pageName: string, viewId: string, split: "horizontaly" | "verticaly") {
        // TODO: Implement
    }*/
}