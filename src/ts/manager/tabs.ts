import { Tab } from "../class/tab";

export class TabsManager {
    private target: Element;
    private tabs: Tab[] = [];
    private selectedTab: Tab | undefined;

    private movingTab: Tab | null = null;
    private nextTab: Tab | undefined = undefined;
    private prevTab: Tab | undefined = undefined;

    private initialMousePosition: number = 0;
    private initialLeft: number = 0; // TODO: Rename this
    private lastDeltaIndex = 0; // TODO: Rename this

    private tabsMovedLeft: Tab[] = [];
    private tabsMovedRight: Tab[] = [];

    private tabFocusedListener: ((id: string) => void)[] = [];
    private tabAddedListener: ((id: string) => void)[] = [];

    private requestTabClosing: (id: string) => Promise<void>;

    // Max Index is tabs.lenght


    constructor(target: Element, closeRequestedListener: (id: string) => Promise<void> ) {
        this.target = target;
        this.requestTabClosing = closeRequestedListener;

        document.addEventListener("mousemove", (e) => this.inDragging(e));
        document.addEventListener("mouseup", (_) => this.stopDragging());
    }

    openNewTab(title: string, id: string) : string {
        let tab = new Tab(this.tabs.length + 1, id, (id) => this.closeTab(id))

        tab.element.addEventListener("mousedown", (e) => {this.focusAndStartDragging(e, tab)});
        tab.element.classList.add("tab");
        tab.element.style.animation = "tab-created 150ms forwards";

        if (this.tabs.length === 0) {
            tab.element.classList.add("selected");
            this.selectedTab = tab;

            this.tabFocusedListener.forEach((listener) => {
                listener(this.selectedTab!.id);
            })
        }

        tab.element.style.order = String(this.tabs.length + 1);
        tab.setTitle(title);

        this.tabs.push(tab);
        this.target.appendChild(tab.element);

        this.tabAddedListener.forEach((listener) => {
            listener(tab.id);
        })

        setTimeout(() => {
            tab.element.style.animation = "";
        }, 150)

        return tab.id;
    }


    setTitle(uuid: string, title: string) {
        let tmp = this.tabs.find(tab => tab.id === uuid);
        if (tmp) {
            tmp.setTitle(title);
        }   
    }

    closeTab(uuid: string) {
        // TODO: Add confirmation

        this.requestTabClosing(uuid).then(() => {
            let tmp = this.tabs.find(tab => tab.id === uuid)
            if (tmp) {
                const index = this.tabs.indexOf(tmp);
                if (index > -1) { this.tabs.splice(index, 1); }

                tmp.element.style.animation = "tab-closed 150ms forwards";

                setTimeout(() => {
                    tmp!.element.remove();

                    this.tabs.forEach((tab) => {
                        if (tab.index > tmp!.index) {
                            tab.index -= 1;
                            tab.element.style.order = String(tab.index);
                        }
                    })
                }, 150);

                if (this.selectedTab!.id == uuid) {
                    if (this.selectedTab!.index - 1 == this.tabs.length) {
                        this.select(this.tabs.length);
                    } else {
                        this.select(this.selectedTab!.index + 1);
                    }
                }
            }
        });
    }

    selectNext() {
        // TODO: Implement
    }

    selectPrevious() {
        // TODO: Implement
    }

    selectFirst() {
        // TODO: Implement
    }

    selectLast() {
        // TODO: Implement
    }

    select(uuid: string) : void;
    select(index: number) : void;
    select(tab: unknown) {
        let tabToFocus: Tab | undefined = undefined;

        if (typeof tab === "string") {
            let uuid = tab;
            tabToFocus = this.tabs.find(tab => tab.id === uuid);
            
        } else {
            let index = tab;
            tabToFocus = this.tabs.find(tab => tab.index === index);
        }

        if (tabToFocus) {
            this.selectedTab?.element.classList.remove("selected");
            this.selectedTab = tabToFocus;
            tabToFocus.element.classList.add("selected");

            this.tabFocusedListener.forEach((listener) => {
                listener(tabToFocus!.id);
            })
        }
    }

    getSelected() : Tab {
        return this.selectedTab!;
    }

    getTab(uuid: string) : Tab | undefined {
        return this.tabs.find(tab => tab.id === uuid)
    }

    addEventListener(event: "tabFocused" | "tabAdded", listener: ((id: string) => void)) {
        switch (event) {
            case "tabFocused":
                this.tabFocusedListener.push(listener);
                break;
            case "tabAdded":
                this.tabAddedListener.push(listener);
                break;
        }
    }

    private focusAndStartDragging(e: MouseEvent, target: Tab) {
        if ((e.target as HTMLElement).classList.contains("close")) {
            return
        }

        this.selectedTab = target;
        this.selectedTab.element.classList.add("selected");

        this.tabs.forEach((el) => {
            if (el != this.selectedTab) {
                el.element.classList.remove("selected");
            }
        })

        this.tabFocusedListener.forEach((listener) => {
            listener(this.selectedTab!.id);
        })

        if (this.tabs.length == 1) {
            return
        }

        e = e || window.event;
        e.preventDefault();
        this.initialMousePosition = e.clientX;
        this.movingTab = target;

        this.movingTab.element.classList.add("dragging");
        this.movingTab.element.style.zIndex = "1";
        this.movingTab.element.style.animation = "";

        let movingIndex = this.movingTab.index;

        this.nextTab = this.tabs.find(item => item.index === movingIndex + 1);
        this.prevTab = this.tabs.find(item => item.index === movingIndex - 1) 

        this.initialLeft = this.movingTab.element.offsetLeft;
    }

    private inDragging(e: MouseEvent) {
        // TODO: Add small gap before moving tab

        if (this.movingTab) {
            let deltaX = e.clientX - this.initialMousePosition;
    
            if ((this.initialLeft + deltaX > 0) && (deltaX + this.movingTab.element.clientWidth + this.initialLeft < this.target.clientWidth)) {
                this.movingTab.element.style.transform = `translateX(${deltaX}px)`
            } else if (this.initialLeft + deltaX < 0) {
                this.movingTab.element.style.transform = `translateX(${-this.initialLeft}px)`
                return
            } else if (deltaX + this.movingTab.element.clientWidth + this.initialLeft > this.target.clientWidth) {
                this.movingTab.element.style.transform = `translateX(${this.target.clientWidth - this.movingTab.element.clientWidth - this.initialLeft}px)`
                return
            }
    
            let deltaIndex = Math.round(deltaX / Number(this.movingTab.element.clientWidth));
    
            if (deltaIndex > this.lastDeltaIndex) {
                if (this.tabsMovedRight.length > 0) {
                    let tmp = this.tabsMovedRight.pop()!;
                    this.movingTab.index += 1;
                    tmp.index -= 1;
                    tmp.element.style.animation = "slide-right-to-initial 150ms forwards";
    
                    this.prevTab = tmp;
                    let lastNextTabIndex = this.prevTab.index;
                    this.nextTab = this.tabs.find(tab => tab.index === lastNextTabIndex + 2);
                } else if (this.nextTab) {
                    this.movingTab.index += 1;
                    this.nextTab.index -= 1;
                    this.nextTab.element.style.animation = "slide-initial-to-left 150ms forwards"
    
                    this.tabsMovedLeft.push(this.nextTab);
                    this.prevTab = this.nextTab;
                    let lastNextTabIndex = this.nextTab.index;
                    this.nextTab = this.tabs.find(tab => tab.index == lastNextTabIndex + 2);
                }
            } else if (deltaIndex < this.lastDeltaIndex) {
                if (this.tabsMovedLeft.length > 0) {
                    let tmp = this.tabsMovedLeft.pop()!;
                    this.movingTab.index -= 1;
                    tmp.index += 1;
                    tmp.element.style.animation = "slide-left-to-initial 150ms forwards";

                    this.nextTab = tmp;
                    let lastNextTabIndex = this.nextTab?.index;
                    this.prevTab = this.tabs.find(tab => tab.index === lastNextTabIndex - 2);
                } else if (this.prevTab) {
                    this.movingTab.index -= 1
                    this.prevTab.index += 1;
                    this.prevTab.element.style.animation = "slide-initial-to-right 150ms forwards"
    
                    this.tabsMovedRight.push(this.prevTab!);
                    this.nextTab = this.prevTab;
                    let lastNextTabIndex = this.prevTab?.index;
                    this.prevTab = this.tabs.find(tab => tab.index === lastNextTabIndex - 2);
                }
            }
    
            this.lastDeltaIndex = deltaIndex;
        }
    }

    private stopDragging() {
        if (!this.movingTab) {
            return
        }
    
        let matrix = new WebKitCSSMatrix(window.getComputedStyle(this.movingTab.element).transform);
        let deltaX = matrix.m41;
    

        this.tabsMovedLeft.forEach((el) => {
            el.element.style.order = `${Number(el.element.style.order) - 1}`;
            el.index = Number(el.element.style.order);
        })
    
        this.tabsMovedRight.forEach((el) => {
            el.element.style.order = `${Number(el.element.style.order) + 1}`;
            el.index = Number(el.element.style.order);
        })


        this.tabs.forEach((tab) => {
            tab.element.style.animation = "";
        })
    
        this.movingTab!.element.style.order = String(this.movingTab!.index);
    
        let deltaIndex = Math.round(deltaX / Number(this.movingTab!.element.clientWidth));
    
        this.movingTab!.element.style.transform = `translateX(${matrix.m41 - deltaIndex * this.movingTab!.element.clientWidth}px)`

        this.movingTab!.index = Number(this.movingTab?.element.style.order);
    
        setTimeout(() => {
            this.movingTab!.element.classList.remove("dragging");
            this.movingTab!.element.style.transform = ""
    
            setTimeout(() => {
                let tmp = this.movingTab!;
                setTimeout(() => {
                    tmp.element.style.zIndex = "";
                }, 200)

                this.movingTab = null;

                this.tabs.forEach((tab) => {
                    tab.element.style.transform = "";
                })
            }, 5)
    
            this.nextTab = undefined;
            this.prevTab = undefined;
            this.initialMousePosition = 0;
            this.tabsMovedLeft = [];
            this.tabsMovedRight = [];
            this.lastDeltaIndex = 0;
            this.initialLeft = 0;
        }, 3);
    }
};