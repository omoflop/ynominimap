import { getUsername } from "./game";
import * as Settings from "./settings";
import { debounce } from "./util";

let ws: WebSocket | undefined;
let isConnecting: boolean = false;
let retryCount: number = 0;

const maxRetries: number = 10;

const connect = () => {
    if (isConnecting) return;
    ws = new WebSocket(Settings.values.partyServerAddress, [], );
    
    ws.onopen = (event) => {
        if (Settings.values.debug) console.log("Connected to party server");
        isConnecting = false;
        retryCount = 0;
        onConnected(event);
    };

    ws.onmessage = (event) => {
        onMessage(event);
    };

    ws.onclose = (event) => {
        isConnecting = false;
        onClose(event);

        if (retryCount < maxRetries) {
            const retryDelay = 100 * Math.pow(1.5, retryCount);
            if (Settings.values.debug) console.log(`Connection to party server lost. Retrying in ${Math.floor(retryDelay/1000)} seconds...`);
            setTimeout(() => {
                retryCount++;
                connect();
            }, retryDelay);
        } else {
            // After retrying X times, wait one minute before reconnecting
            setTimeout(() => {
                retryCount = 0;
                connect();
            }, 60_000);
        }
    };

    ws.onerror = (error) => {
        onError(error);
    };
};

export const isConnected = () : boolean => {
    return ws != undefined && ws.readyState === WebSocket.OPEN
};

export const send = (type: string, data: object) => {
    if (!isConnected()) return;

    const packet = { type: type };
    Object.assign(packet, data);
    ws?.send(JSON.stringify(packet));
    if (Settings.values.debug) console.log(`Send packet to server: ${JSON.stringify(packet)}`);
}

export const partyMembers: Set<string> = new Set();
export const roomData: Map<string, [number, number]> = new Map();

const onConnected = (event: Event) => {
    send("update_username", {username: getUsername()});
};

const onMessage = (event: Event) => {
    const packet: any = JSON.parse((event as any).data);
    console.log(`Recieved packet from server: ${(event as any).data}`);
    switch (packet.type) {
        case "toast": {
            showToastMessage(packet.message, "party")
            break;
        }
        case "update_position": {
            const who: string = packet.who;
            const x: number = packet.x;
            const y: number = packet.y;

            roomData.set(who, [x, y]);
            if (!partyMembers.has(who)) {
                partyMembers.add(who);
            }
            break;
        }
        case "leave_room": {
            const who: string = packet.who;

            roomData.delete(who);
            break;
        }
        case "leave_party": {
            const who: string = packet.who;

            partyMembers.delete(who);
            roomData.delete(who);
            break;
        }
    }
};

const onClose = (event: Event) => {

};

const onError = (event: Event) => {

};

export const updateParty = (partyName: string, partyPassword: string) => {
    roomData.clear();
    partyMembers.clear();
    send("update_party", {
        name: partyName,
        password: partyPassword
    });
};

export const updatePosition = (x: number, y: number) => {
    send("update_position", {
        x: x,
        y: y
    });
};

export const updateRoom = (roomId: string) => {
    send("update_room", {
        room_id: roomId
    });
};

let lastPartyName = "";
let lastPartyPassword = "";

export const onGameLoaded = () => {
    connect();

    // Check if the party changed once a second
    setInterval(() => {
        const partyName = Settings.values.partyName;
        const partyPassword = Settings.values.partyPassword;

        if (partyName != lastPartyName || partyPassword != lastPartyPassword) {
            updateParty(partyName, partyPassword);
        }

        lastPartyName = partyName;
        lastPartyPassword = partyPassword;
    }, 1_000);
};

export const onMapChanged = (mapId: string, playerX: number, playerY: number) => {
    updateRoom(mapId);
    updatePosition(playerX, playerY);
    roomData.clear();
}
