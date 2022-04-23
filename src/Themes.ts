import { DOMCacheGetOrSet } from './Cache/DOM';
import { player } from "./Synergism"

const themeName = ["Dark", "Gray", "Light", "Black"];
const themeClass = ["dark", "gray", "light", "black"];

export const toggleTheme = () => {
    player.theme++;
    if (!isFinite(player.theme) || player.theme < 0 || player.theme >= themeClass.length) {
        player.theme = 0;
    }
    themeUpdate();
}

export const themeUpdate = () => {
    if (!isFinite(player.theme) || player.theme < 0 || player.theme >= themeClass.length) {
        player.theme = 0;
    }

    const themeButton = DOMCacheGetOrSet('theme');
    const className = (DOMCacheGetOrSet("offlineContainer")!.style.display === "none" ? "" : "loading ");

    document.body.className = className + themeClass[player.theme];
    themeButton.textContent = "Theme: " + themeName[player.theme];
}