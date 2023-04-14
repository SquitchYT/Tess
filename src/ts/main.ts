import { ViewsManager } from './manager/view';
import { listen } from '@tauri-apps/api/event'

window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
})

let viewsManager = new ViewsManager(document.querySelector(".views")!, document.querySelector(".tabs")!, document.querySelector(".toasts")!);
viewsManager.openProfile("sh -c $SHELL", true);


document.querySelector(".open")!.addEventListener("click", () => {
    viewsManager.openProfile("fish", true);
})


listen<string>("global_config_updated", (e) => {
    console.log("Updated config:", e.payload);
});