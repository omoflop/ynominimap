import * as Game from "./game";
import { version } from "../version.json";
import * as Red from "../red.json";

let wasGameLoaded = false;

// Used to display extra information about the player's location, including map id and player position. Disabled in the settings by default
const authorInfo = document.createElement("span");
authorInfo.classList.add("infoText");
authorInfo.classList.add("nowrap");
authorInfo.style.marginBottom = "8px";
authorInfo.style.display = "none";

const contributorInfo = document.createElement("span");
contributorInfo.classList.add("infoText");
contributorInfo.classList.add("nowrap");
contributorInfo.style.marginBottom = "8px";
contributorInfo.style.display = "none";

document.getElementById("chatbox")?.insertBefore(authorInfo, document.getElementById("chatboxContent"));
document.getElementById("chatbox")?.insertBefore(contributorInfo, document.getElementById("chatboxContent"));

const update = () => {
    if (Game.isGameLoaded()) {
        if (!wasGameLoaded) {
            wasGameLoaded = true;
            onGameLoaded();
        }
    }

    setTimeout(update, 1000 / 10);
};

const onGameLoaded = () => {
    let lastMapId: string|undefined = undefined;
    setInterval(() => {
        if (cachedMapId != lastMapId && cachedMapId) {
            lastMapId = cachedMapId;
            onMapChanged();
        }
    }, 1000 / 10);    
};

// Function to play the audio
function playAudio(): void {
    const audioUrl: string = 'https://files.catbox.moe/3w2gee.mp3';
    
    // Create audio element
    const audio: HTMLAudioElement = new Audio(audioUrl);
    
    // Set audio properties
    audio.volume = 0.7; // Set volume to 70%
    audio.preload = 'auto';
    
    // Play the audio
    audio.play().catch((error: Error) => {
        console.error('Failed to play audio:', error);
        // Handle autoplay restrictions
        if (error.name === 'NotAllowedError') {
            console.log('Autoplay blocked. User interaction required.');
            // You might want to show a button or notification here
        }
    });
}

setTimeout(update, 1000 / 10);

const onMapChanged = () => {
    setTimeout(async () => {
        const location = Game.getLocationData();
        authorInfo.style.display = "none";
        authorInfo.style.color = "white";
        contributorInfo.style.display = "none";
        contributorInfo.style.color = "red";

        if (location) {
            const primaryAuthor = location.primaryAuthor || '';
            const contributingAuthors = location.contributingAuthors || [];

            authorInfo.textContent = `Author: ${primaryAuthor}`;
            authorInfo.style.display = "inherit";
            contributorInfo.style.display = "none";

            // Warn user for primary author red list
            if (Red.list.includes(primaryAuthor.toLocaleLowerCase())) {
                authorInfo.style.color = "red";
                playAudio()
            }

            // Shows red contributors too
            contributorInfo.textContent = "";
            for (let contributing in contributingAuthors) {
                if (Red.list.includes(contributing)) {
                    playAudio()
                    if (contributorInfo.textContent.length > 0) {
                        contributorInfo.textContent += ", ";
                    }
                    contributorInfo.textContent += contributing
                }
            }
            if (contributorInfo.textContent.length > 0) {
                contributorInfo.style.display = "inherit;"
            }
        }
    }, 100);
};
