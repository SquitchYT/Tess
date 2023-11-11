import { ViewsManager } from './manager/view';
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { Option } from './schema/option';


window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
})


invoke<Option>("get_configuration").then((option) => {
    if (option.background != "opaque" && !(option.background instanceof Object)) {
        document.body.style.background = "transparent";
    } else if (option.background instanceof Object) {
        let background = document.createElement("img");
            background.src = convertFileSrc(option.background.media.location);
            background.classList.add("background-image");
            background.style.setProperty("-webkit-filter", `blur(${option.background.media.blur}px)`);
            document.body.appendChild(background)
    }
    

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
})

