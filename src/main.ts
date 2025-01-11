import * as Settings from "./settings";
import * as PageUtil from "./pageutil";
import * as Minimap from "./minimap";
import * as Game from "./game";
import { version } from "../version.json";

const minimapButtonHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M4 12L20 12M12 4L12 20M6.2 20H17.8C18.9201 20 19.4802 20 19.908 19.782C20.2843 19.5903 20.5903 19.2843 20.782 18.908C21 18.4802 21 17.9201 21 16.8V7.2C21 6.0799 21 5.51984 20.782 5.09202C20.5903 4.71569 20.2843 4.40973 19.908 4.21799C19.4802 4 18.9201 4 17.8 4H6.2C5.0799 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.07989 3 7.2V16.8C3 17.9201 3 18.4802 3.21799 18.908C3.40973 19.2843 3.71569 19.5903 4.09202 19.782C4.51984 20 5.07989 20 6.2 20Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'

// Used to toggle the visibility of the minimap, hidden in rooms where the map fails to load.
const minimapToggleButton = PageUtil.createButton(minimapButtonHTML, PageUtil.ButtonSide.Right, "controls-fullscreen");
minimapToggleButton.style.display = "";

// Used to display extra information about the player's location, including map id and player position. Disabled in the settings by default
const extraLocationInfo = document.createElement("span");
extraLocationInfo.classList.add("infoText");
extraLocationInfo.classList.add("nofilter");

extraLocationInfo.style.marginBottom = "8px";
extraLocationInfo.style.display = "none";
extraLocationInfo.style.textShadow = "2px 4px 4px black";

// Place the extra location info below the minimap
Minimap.canvas.after(extraLocationInfo);

minimapToggleButton.onclick = () => {
    Settings.values.hideMinimap = !Settings.values.hideMinimap;
    Minimap.updateVisbility();
    updateExtraLocationInfo();
};

export const updateExtraLocationInfo = () => {
    const shouldBeVisible = Settings.values.extraLocationInfo && !Settings.values.hideMinimap;
    extraLocationInfo.style.display = shouldBeVisible ? "" : "none";
};

let wasGameLoaded = false;

const update = () => {
    if (Game.isGameLoaded()) {
        if (!wasGameLoaded) {
            wasGameLoaded = true;
            onGameLoaded();
        }

        Minimap.update();
        Minimap.draw();
    }

    setTimeout(update, 1000 / Settings.values.updatesPerSecond);
};

const onGameLoaded = () => {
    // Compare the version of the script to the one on github
    const metadataUrl = `${Settings.values.assetServerAddress}/userscript/version.json`;
    fetch(metadataUrl)
    .then(response => {
        if (!response.ok) throw new Error(`Failed to reach to asset server (${metadataUrl})`);
        return response.json();
    })
    .then(json => {
        if (version < json.version) {
            showToastMessage("There is an update available for YnoMinimap! <a href='https://github.com/omoflop/ynomapdatabase' target='_blank'>Download here</a>", "info", true, undefined, true)
        }
    })
    .catch(error => {
        if (Settings.values.debug) console.error(error);
    });

    Minimap.updateVisbility();
    updateExtraLocationInfo();
};

setTimeout(update, 1000 / Settings.values.updatesPerSecond);

setInterval(() => {
    if (!Game.isGameLoaded() || extraLocationInfo.style.display == 'none') return;
    const [px, py]: number[] = Game.getPlayerCoords();
    extraLocationInfo.textContent = `Map Id: ${Game.getMapId()}, x: ${px}, y: ${py}`;
}, 1000 / 10);
