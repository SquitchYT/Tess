import { ViewsManager } from './manager/view';
import { listen } from '@tauri-apps/api/event';
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { Option } from './schema/option';

window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
})

invoke<Option>("get_configuration").then((option) => {
    let stylesheet = document.createElement("link");
    stylesheet.type = "text/css";
    stylesheet.rel = "stylesheet";
    stylesheet.href = convertFileSrc(option.appTheme);
    document.head.appendChild(stylesheet);

    let viewsManager = new ViewsManager(document.querySelector(".views")!, document.querySelector(".tabs")!, document.querySelector(".toasts")!, option);

    viewsManager.openProfile(option.defaultProfile.uuid, true)


    document.querySelector(".open")!.addEventListener("click", () => {
        viewsManager.openProfile(option.defaultProfile.uuid, true);
    })
    
    listen<string>("global_config_updated", (e) => {
        console.log("Updated config:", e.payload);
    });
})

