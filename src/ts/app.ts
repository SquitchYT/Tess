import { TabsManager } from "./manager/tabs";
import { listen, Event } from '@tauri-apps/api/event'
import { v4 as uuid } from 'uuid';
import { invoke } from '@tauri-apps/api/tauri'

import {terminalTitleChangedPayload } from "./schema/term";
import { View } from "./class/views";
import { Toaster } from "./manager/toast";

import { Option, ShortcutAction } from "ts/schema/option";
import { PopupManager } from "./manager/popup";
import { TerminalPane } from "ts/class/panes";
import { ShortcutsManager } from "./manager/shortcuts";
import { clipboard } from "@tauri-apps/api";
import { PopupBuilder, PopupButton } from "./class/popup";


export class App {
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
        this.tabsManager.addEventListener("titleUpdated", (id) => { this.onTabTitleUpdated(id); });
        this.popupManager = new PopupManager();

        this.shortcutsManager = new ShortcutsManager(option.shortcuts, (action) => { this.onShortcutExecuted(action) });

        listen<terminalTitleChangedPayload>("js_pty_title_update", (e) => { this.onTerminalTitleUpdated(e); })
        listen<string>("js_pty_closed", (e) => { this.onTerminalProcessExited(e); });

        listen("js_window_request_closing", () => { this.closeViews(); });
        listen<number>("js_app_request_exit", (e) => { this.closeAllWindows(e); });

        this.toaster = new Toaster(toastTarget);

        this.option = option;
    }

    private async closeAllWindows(e: Event<number>) {
        let confirmButton = new PopupButton("confirm", "validate");
        let cancelButton = new PopupButton("cancel", "dismiss");

        let popupResult = await this.popupManager.sendPopup(new PopupBuilder(`Confirm close of ${e.payload} windows`).withMessage(`Are you sure to close the app?`).withButtons(confirmButton, cancelButton));
        if (popupResult.action == "confirm") {
            invoke("utils_close_app");
        }
    }

    private onTabFocused(id: string) {
        let view = this.views.find((view) => view.id! == id);
        let tab = this.tabsManager.getTab(id);

        if (view && tab) {
            this.focusedView = view;
            view.focus();
            invoke("window_set_title", {title: tab.title});

            this.views.forEach((view) => {
                if (view.id != id) {
                    view.unfocus();
                }
            })
        }
    }


    private onTabTitleUpdated(id: string) {
        let tab = this.tabsManager.getTab(id);

        if (this.focusedView?.id == id && this.option.desktopIntegration.dynamic_title && tab) {
            invoke("window_set_title", {title: tab.title});
        }
    }

    private async onTabRequestClose(id: string) {
        let view = this.views.find((view) => view.id == id);
        if (view) {
            view.requestClosingAll().catch((err) => {
                this.toaster.toast("Interaction error", err, "error");
                throw err;
            })
        }
    }

    private onViewsClosed(uuid: string) {
        let view = this.views.find((view) => view.id == uuid);
        if (view) {
            view.element!.remove();
            this.views.splice(this.views.indexOf(view), 1);
            if (this.views.length == 0) {
                invoke("window_close");
            }
        }

        this.tabsManager.closeTab(uuid);
    }

    private onTerminalTitleUpdated(e: Event<terminalTitleChangedPayload>) {
        this.views.forEach((view) => {
            if (view.getTerm(e.payload.id)) {
                view.updatePaneTitle(e.payload.id, e.payload.title)
            }
        })
    }

    private onTerminalPaneInput(id: string, data: string) {
        invoke("pty_write", {content: data, id: id}).catch((err) => {
            this.toaster.toast("Interaction error", err, "error");
        });
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
                        invoke("pty_write", {content: macro.content, id: this.focusedView!.focusedPane!.id}).catch((err) => {
                            this.toaster.toast("Macro error", err, "error");
                        });
                    }
                    break;
                default:
                    this.toaster.toast("Unknown shortcut", action[0] + " is not yet implemented");
            }
        } else {
            switch (action) {
                case "copy":
                    clipboard.writeText((this.focusedView!.focusedPane! as TerminalPane).term!.term.getSelection());
                    break;
                case "paste":
                    let clipboardContent = await clipboard.readText();
                    if (clipboardContent) {
                        invoke("pty_write", {content: clipboardContent, id: this.focusedView!.focusedPane!.id}).catch((err) => {
                            this.toaster.toast("Interaction error", err, "error");
                        });
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
                    this.toaster.toast("Unknown shortcut", action + " is not yet implemented");
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

                invoke("window_close");
            }
        }
    }

    openProfile(profileId: string, focus: boolean) {
        let viewId = uuid();
        let paneId = uuid();

        let profile = this.option.profiles.find(profile => profile.uuid == profileId);
        if (profile) {
            let view = new View(viewId, this.popupManager, this.toaster, (id) => { this.onViewsClosed(id); }, (title) => { this.tabsManager.setTitle(viewId, title); }, (viewId) => { this.onViewGotUnreadData(viewId) }, (viewId, progress) => { this.onViewGotProgressUpdate(viewId, progress) })
            
            view.openPane(paneId, profile, (e, term) => { return this.shortcutsManager.onKeyPress(e, term); }).then(() => {
                this.views.push(view);
                this.target.appendChild(view.element!);
    
                view.getTerm(paneId)!.term.onData((content, _) => {
                    this.onTerminalPaneInput(paneId, content);
                });
    
                this.tabsManager.openNewTab(viewId);
    
                if (focus) { this.tabsManager.select(viewId); }
            }).catch((err) => {
                this.toaster.toast("Unable to create a view",  err, "error");
            })
        } else {
            this.toaster.toast("Unable to create a view", `There is no profile corresponding to ID: '${profileId}'`, "error");
        }
    }

    closeViewPane(viewId: string, paneId: string) {
        let view = this.views.find((view) => view.id == viewId);

        if (view) {
            view.requestClosingOne(paneId).catch((err) => {
                this.toaster.toast("Unable to close a view's pane",  err, "error");
            })
        }
    }

    private onViewGotUnreadData(viewId: string) {
        this.tabsManager.setHightlight(viewId, true);
    }

    private onViewGotProgressUpdate(viewId: string, progress: number) {
       this.tabsManager.setprogress(viewId, progress);
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