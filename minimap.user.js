// ==UserScript==
// @name         YnoProject Minimap
// @namespace    https://github.com/omoflop
// @version      2025-01-14
// @description  A live, interactive minimap for ynoproject
// @author       omoflop
// @match        https://ynoproject.net/*
// @grant        none
// ==/UserScript==
"use strict";
(() => {
  // src/lazyimage.ts
  var LazyImage = class {
    value;
    imageReady = false;
    constructor(url = void 0, onLoad = void 0) {
      if (url) this.loadNewImage(url, onLoad);
    }
    loadNewImage(url = void 0, onLoad = void 0) {
      this.imageReady = false;
      this.value = new Image();
      this.value.crossOrigin = "anonymous";
      this.value.onload = () => {
        this.imageReady = true;
        if (values.debug) console.log(`Loaded image from url: ${url}`);
        if (onLoad) onLoad();
      };
      this.value.onerror = () => {
        if (values.debug) console.error(`Failed to load image from url: ${url}`);
      };
      this.value.src = url;
    }
  };

  // src/game.ts
  var isGameLoaded = () => typeof gameId !== "undefined" && typeof cachedMapId !== "undefined" && typeof easyrpgPlayer !== "undefined" && typeof easyrpgPlayer.api !== "undefined" && typeof playerData !== "undefined" && typeof playerData?.name !== "undefined";
  var getGameId = () => gameId;
  var getMapId = () => cachedMapId;
  var getPlayerCoords = () => easyrpgPlayer.api.getPlayerCoords();
  var getPrevMapId = () => typeof cachedPrevMapId !== "undefined" ? cachedPrevMapId : "0000";
  var getUsername = () => playerData.name;

  // src/util.ts
  var dist = (x1, x2, y1, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };
  var approach = (val, goal, step) => {
    return val < goal ? Math.min(goal, val + step) : Math.max(goal, val - step);
  };
  var wrapText = (text, maxCharsPerLine = 16) => {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";
    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      if (testLine.length > maxCharsPerLine && currentLine !== "") {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };
  var generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // src/partyserver.ts
  var ws;
  var isConnecting = false;
  var retryCount = 0;
  var maxRetries = 10;
  var connect = () => {
    if (isConnecting) return;
    ws = new WebSocket(values.partyServerAddress, []);
    ws.onopen = (event) => {
      if (values.debug) console.log("Connected to party server");
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
        if (values.debug) console.log(`Connection to party server lost. Retrying in ${Math.floor(retryDelay / 1e3)} seconds...`);
        setTimeout(() => {
          retryCount++;
          connect();
        }, retryDelay);
      } else {
        setTimeout(() => {
          retryCount = 0;
          connect();
        }, 6e4);
      }
    };
    ws.onerror = (error) => {
      onError(error);
    };
  };
  var isConnected = () => {
    return ws != void 0 && ws.readyState === WebSocket.OPEN;
  };
  var send = (type, data) => {
    if (!isConnected()) return;
    const packet = { type };
    Object.assign(packet, data);
    ws?.send(JSON.stringify(packet));
    if (values.debug) console.log(`Send packet to server: ${JSON.stringify(packet)}`);
  };
  var partyMembers = /* @__PURE__ */ new Set();
  var roomData = /* @__PURE__ */ new Map();
  var onConnected = (event) => {
    send("update_username", { username: getUsername() });
  };
  var onMessage = (event) => {
    const packet = JSON.parse(event.data);
    console.log(`Recieved packet from server: ${event.data}`);
    switch (packet.type) {
      case "toast": {
        showToastMessage(packet.message, "party");
        break;
      }
      case "update_position": {
        const who = packet.who;
        const x = packet.x;
        const y = packet.y;
        roomData.set(who, [x, y]);
        if (!partyMembers.has(who)) {
          partyMembers.add(who);
        }
        break;
      }
      case "leave_room": {
        const who = packet.who;
        roomData.delete(who);
        break;
      }
      case "leave_party": {
        const who = packet.who;
        partyMembers.delete(who);
        roomData.delete(who);
        break;
      }
    }
  };
  var onClose = (event) => {
  };
  var onError = (event) => {
  };
  var updateParty = (partyName, partyPassword) => {
    roomData.clear();
    partyMembers.clear();
    send("update_party", {
      name: partyName,
      password: partyPassword
    });
  };
  var updatePosition = (x, y) => {
    send("update_position", {
      x,
      y
    });
  };
  var updateRoom = (roomId) => {
    send("update_room", {
      room_id: roomId
    });
  };
  var lastPartyName = "";
  var lastPartyPassword = "";
  var onGameLoaded = () => {
    connect();
    setInterval(() => {
      const partyName = values.partyName;
      const partyPassword = values.partyPassword;
      if (partyName != lastPartyName || partyPassword != lastPartyPassword) {
        updateParty(partyName, partyPassword);
      }
      lastPartyName = partyName;
      lastPartyPassword = partyPassword;
    }, 1e3);
  };
  var onMapChanged = (mapId, playerX, playerY) => {
    updateRoom(mapId);
    updatePosition(playerX, playerY);
    roomData.clear();
  };

  // src/minimaptypes.ts
  var areBidirectional = (teleport1, teleport2, currentMapId, maxDistance = 1) => {
    if (teleport1.destination_map_id !== currentMapId || teleport2.destination_map_id !== currentMapId)
      return false;
    const distanceFromT1ToT2Dest = dist(
      teleport1.x,
      teleport2.destination_x,
      teleport1.y,
      teleport2.destination_y
    );
    const distanceFromT2ToT1Dest = dist(
      teleport2.x,
      teleport1.destination_x,
      teleport2.y,
      teleport1.destination_y
    );
    return distanceFromT1ToT2Dest <= maxDistance && distanceFromT2ToT1Dest <= maxDistance;
  };

  // src/minimap.ts
  var canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  canvas.style.userSelect = "none";
  canvas.style.display = "none";
  canvas.style.marginBottom = "2px";
  document.getElementById("chatbox")?.insertBefore(canvas, document.getElementById("chatboxContent"));
  var ctx = canvas.getContext("2d");
  var textLineHeight = ctx.measureText("M").width * 1.5;
  ctx.imageSmoothingEnabled = false;
  var panX = 0;
  var panY = 0;
  var zoom = 1;
  var mouseX = 0;
  var mouseY = 0;
  var panOffsetX = 0;
  var panOffsetY = 0;
  var mouseDown = false;
  var mapImage = new LazyImage();
  var previousMapId = "";
  var displayPlayerX = 0;
  var displayPlayerY = 0;
  var lockOnPlayer = true;
  var loopType = "none" /* None */;
  var exitTeleports = [];
  var mapTeleports = [];
  var lastPositionX = 0;
  var lastPositionY = 0;
  canvas.addEventListener("wheel", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mx = event.offsetX * canvas.width / rect.width;
    const my = event.offsetY * canvas.height / rect.height;
    const worldMouseX = (mx - panX) / zoom;
    const worldMouseY = (my - panY) / zoom;
    const isZoomingIn = event.deltaY < 0;
    zoom *= isZoomingIn ? 2 : 0.5;
    panX = mx - worldMouseX * zoom;
    panY = my - worldMouseY * zoom;
    event.preventDefault();
  });
  canvas.addEventListener("mousedown", (event) => {
    if (event.button == 0) {
      mouseDown = true;
      panOffsetX = event.clientX - panX;
      panOffsetY = event.clientY - panY;
      lockOnPlayer = false;
    } else if (event.button == 1) {
      const [worldMouseX, worldMouseY] = calculateWorldMousePos(event);
    }
  });
  canvas.addEventListener("contextmenu", (event) => {
    lockOnPlayer = true;
    event.preventDefault();
  });
  document.addEventListener("mouseup", (event) => {
    mouseDown = false;
  });
  document.addEventListener("mousemove", (event) => {
    if (mouseDown) {
      panX = event.clientX - panOffsetX;
      panY = event.clientY - panOffsetY;
    }
    [mouseX, mouseY] = calculateWorldMousePos(event);
  });
  var updateVisbility = () => {
    if (values.hideMinimap || !isGameLoaded()) {
      canvas.style.display = "none";
      if (values.debug) console.log("Minimap hidden. Either Settings.values.hideMinimap is true or the game is not loaded!");
      return;
    }
    if (!(mapImage?.imageReady ?? false) && values.hideMinimapIfNoMap) {
      canvas.style.display = "none";
      if (values.debug) console.log("Minimap hidden. Either the image isn't ready or hideMinimapIfNoMap is true");
      return;
    }
    if (values.debug) console.log("Minimap visible!");
    canvas.style.display = "";
  };
  var centerOnPlayer = () => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    panX = centerX - (displayPlayerX + 8) * zoom;
    panY = centerY - (displayPlayerY + 8) * zoom;
  };
  var update = () => {
    let mapId = getMapId();
    if (mapId && mapId != previousMapId) {
      if (values.debug) console.log(`New map loaded: ${mapId} (prev ${previousMapId})`);
      onMapChanged2(mapId);
    }
    previousMapId = mapId;
    const [playerX, playerY] = getPlayerCoords();
    if (playerX != lastPositionX || playerY != lastPositionY) {
      updatePosition(playerX, playerY);
    }
    lastPositionX = playerX;
    lastPositionY = playerY;
    if (dist(playerY * 16, displayPlayerX, playerY * 16, displayPlayerY) > 16 * 4) {
      displayPlayerX = playerX * 16;
      displayPlayerY = playerY * 16;
    }
    const framerateDelta = values.updatesPerSecond / 30;
    displayPlayerX = approach(displayPlayerX, playerX * 16, framerateDelta);
    displayPlayerY = approach(displayPlayerY, playerY * 16, framerateDelta);
    if (lockOnPlayer) centerOnPlayer();
  };
  var draw = () => {
    if (canvas.style.display == "none") return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(
      zoom,
      0,
      // Scale X
      0,
      zoom,
      // Scale Y
      panX,
      // Translate X
      panY
      // Translate Y
    );
    let xx = 0;
    let yy = 0;
    if (values.enableLooping && mapImage.imageReady) {
      if (loopType == "both" /* Both */ || loopType == "horizontal" /* Horizontal */) xx = 1;
      if (loopType == "both" /* Both */ || loopType == "vertical" /* Vertical */) yy = 1;
    }
    if (mapImage.imageReady) {
      for (let x = -xx; x <= xx; x++)
        for (let y = -yy; y <= yy; y++) {
          const loopX = mapImage.value.width * x;
          const loopY = mapImage.value.height * y;
          ctx.drawImage(mapImage.value, loopX, loopY);
        }
    }
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(displayPlayerX + 8, displayPlayerY + 8, 8, 0, Math.PI * 2);
    ctx.fill();
    roomData.forEach((pos, user) => {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(pos[0] * 16 + 8, pos[1] * 16 + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `12px Arial`;
      ctx.textAlign = "center";
      ctx.lineWidth = 1;
      ctx.fillStyle = `rgba(255, 255, 255, 255)`;
      ctx.fillText(user, pos[0] * 16 + 8, pos[1] * 16 - 8);
    });
    for (let x = -xx; x <= xx; x++)
      for (let y = -yy; y <= yy; y++) {
        if (x == 0 && y == 0 || values.showWarpsInLoops && mapImage.imageReady) {
          const loopX = mapImage.value.width * x;
          const loopY = mapImage.value.height * y;
          mapTeleports.forEach((warp) => {
            const warpX = warp.x * 16 + 8 + loopX;
            const warpY = warp.y * 16 + 8 + loopY;
            const warpDestX = warp.destinationX * 16 + 8 + loopX;
            const warpDestY = warp.destinationY * 16 + 8 + loopY;
            ctx.fillStyle = warp.color;
            ctx.beginPath();
            ctx.arc(warpX, warpY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = warp.color;
            ctx.beginPath();
            ctx.arc(warpDestX, warpDestY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = warp.color;
            ctx.beginPath();
            ctx.moveTo(warpX, warpY);
            ctx.lineTo(warpDestX, warpDestY);
            ctx.stroke();
          });
          exitTeleports.forEach((exit) => {
            const tx = exit.x * 16 + 8 + loopX;
            const ty = exit.y * 16 + 8 + loopY;
            let textSize = 18 / zoom;
            ctx.font = `bold ${Math.round(textSize)}px Arial`;
            ctx.textAlign = "center";
            ctx.lineWidth = 1;
            const maxDistance = 200;
            const minScale = 0.5;
            const minAlpha = values.farWarpVisibility;
            exit.destinationNameLines.forEach((text, lineIndex) => {
              const y2 = ty + lineIndex * textLineHeight / zoom;
              const distance = dist(tx, mouseX, y2, mouseY);
              const distanceRatio = Math.min(distance / maxDistance, 1);
              const scale = 1 - distanceRatio * (1 - minScale);
              const alpha = 1 - distanceRatio * (1 - minAlpha);
              ctx.save();
              ctx.translate(tx, y2);
              ctx.scale(scale, scale);
              ctx.translate(-tx, -y2);
              ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
              ctx.strokeText(text, tx, y2);
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.fillText(text, tx, y2);
              ctx.restore();
            });
          });
        }
      }
  };
  var onMapChanged2 = (mapId) => {
    const gameId2 = getGameId();
    if (values.debug) console.log("Loading new map image");
    mapImage.loadNewImage(`${values.assetServerAddress}/maps/${gameId2}/${mapId}/map.png?idk-what-im-doing`, updateVisbility);
    loopType = "none" /* None */;
    exitTeleports.length = 0;
    mapTeleports.length = 0;
    const [playerX, playerY] = getPlayerCoords();
    const mapMetaUrl = `${values.assetServerAddress}/maps/${gameId2}/${mapId}/metadata.json?idk-what-im-doing`;
    fetch(mapMetaUrl).then((response) => {
      if (!response.ok) throw new Error(`Failed to load metadata from url: ${mapMetaUrl}`);
      return response.json();
    }).then((data) => {
      loopType = data.loop_type ?? "none" /* None */;
      const teleportData = data.teleport_data ?? [];
      const colorMap = /* @__PURE__ */ new Map();
      const processedPairs = /* @__PURE__ */ new Set();
      const MAX_CONNECTED_DISTANCE = 2;
      const mapTeleportData = teleportData.filter(
        (teleport) => teleport.destination_map_id == mapId
      );
      mapTeleportData.forEach((teleport, index) => {
        const teleportKey = `${teleport.x},${teleport.y}`;
        if (processedPairs.has(teleportKey)) return;
        const locationKey = [
          teleport.x,
          teleport.y,
          teleport.destination_x,
          teleport.destination_y
        ].join(",");
        const reverseKey = [
          teleport.destination_x,
          teleport.destination_y,
          teleport.x,
          teleport.y
        ].join(",");
        let color;
        if (colorMap.has(locationKey)) {
          color = colorMap.get(locationKey);
        } else if (colorMap.has(reverseKey)) {
          color = colorMap.get(reverseKey);
        } else {
          color = generateRandomColor();
          colorMap.set(locationKey, color);
        }
        const partner = mapTeleportData.find((otherTeleport, otherIndex) => index !== otherIndex && areBidirectional(teleport, otherTeleport, mapId), MAX_CONNECTED_DISTANCE);
        if (partner) {
          processedPairs.add(teleportKey);
          processedPairs.add(`${partner.x},${partner.y}`);
          mapTeleports.push({
            x: teleport.x,
            y: teleport.y,
            destinationX: partner.x,
            destinationY: partner.y,
            color,
            biDirectional: true
          });
        } else {
          mapTeleports.push({
            x: teleport.x,
            y: teleport.y,
            destinationX: teleport.destination_x,
            destinationY: teleport.destination_y,
            color,
            biDirectional: false
          });
        }
      });
      const exitTeleportData = teleportData.filter(
        (teleport) => teleport.destination_map_id != mapId
      );
      exitTeleportData.forEach((teleport) => {
        const destinationName = teleport.destination_name ? teleport.destination_name : findNameForMap(mapId, playerX, playerY);
        exitTeleports.push({
          x: teleport.x,
          y: teleport.y,
          destinationNameLines: wrapText(destinationName)
        });
      });
    }).catch((error) => {
      if (values.debug) console.error(error);
    });
    onMapChanged(mapId, playerX, playerY);
  };
  var findNameForMap = (mapId, playerX, playerY) => {
    return getLocalizedMapLocations(getGameId(), mapId, getPrevMapId(), playerX, playerY);
  };
  var calculateWorldMousePos = (event) => {
    const rect = canvas.getBoundingClientRect();
    const mx = event.offsetX * canvas.width / rect.width;
    const my = event.offsetY * canvas.height / rect.height;
    var worldMouseX = (mx - panX) / zoom;
    var worldMouseY = (my - panY) / zoom;
    return [worldMouseX, worldMouseY];
  };

  // src/settings.ts
  var intSetting = (name, onChanged = void 0) => {
    return {
      name,
      onChanged,
      type: 0 /* Int */,
      extra: void 0
    };
  };
  var timeSetting = (name, onChanged = void 0) => {
    return {
      name,
      onChanged,
      type: 1 /* Time */,
      extra: void 0
    };
  };
  var boolSetting = (name, onChanged = void 0) => {
    return {
      name,
      onChanged,
      type: 2 /* Bool */,
      extra: void 0
    };
  };
  var textSetting = (name, onChanged = void 0, pattern = void 0) => {
    return {
      name,
      onChanged,
      type: 3 /* Text */,
      extra: pattern
    };
  };
  var percentSetting = (name, onChanged = void 0) => {
    return {
      name,
      onChanged,
      type: 4 /* Percentage */,
      extra: void 0
    };
  };
  var values = {
    // General
    hideMinimap: false,
    updatesPerSecond: 60,
    enableLooping: true,
    extraLocationInfo: true,
    hideMinimapIfNoMap: true,
    // Pings
    pingLifetime: 10,
    drawLineToPings: true,
    // Warps
    showWarps: true,
    farWarpVisibility: 0.1,
    showWarpsInLoops: true,
    // Party
    partyName: "",
    partyPassword: "",
    // Debug
    debug: true,
    assetServerAddress: "https://raw.githubusercontent.com/omoflop/ynomapdatabase/refs/heads/main",
    partyServerAddress: "wss://yno.womenkissingwo.men/ws"
  };
  var menuMetadata = {
    structure: {
      general: [
        boolSetting("hideMinimap", updateVisbility),
        intSetting("updatesPerSecond"),
        boolSetting("enableLooping"),
        boolSetting("extraLocationInfo", updateExtraLocationInfo),
        boolSetting("hideMinimapIfNoMap", updateVisbility)
      ],
      pings: [
        timeSetting("pingLifetime"),
        boolSetting("drawLineToPings")
      ],
      warps: [
        boolSetting("showWarps"),
        percentSetting("farWarpVisibility"),
        boolSetting("showWarpsInLoops")
      ],
      party: [
        textSetting("partyName"),
        textSetting("partyPassword")
      ],
      debug: [
        boolSetting("debug"),
        textSetting("assetServerAddress"),
        textSetting("partyServerAddress")
      ]
    },
    descriptions: {
      // General
      hideMinimap: "Enables/disables the visibility of the minimap",
      updatesPerSecond: "How many times per second the map is refreshed",
      enableLooping: "Should the minimap loop if the current room supports it?",
      extraLocationInfo: "Show extra location info below the minimap, including the map id, and the player's position",
      hideMinimapIfNoMap: "Should the minimap hide if the game map image couldn't be loaded?",
      // Pings
      pingLifetime: "How many seconds pings last before dissapearing",
      drawLineToPings: "Should lines be shown between the player and pings?",
      // Warps
      showWarps: "Should warps be displayed on the minimap?",
      farWarpVisibility: "Determines the visiblility of warps far from the mouse, player, or pings. Ignored if warps are disabled.",
      showWarpsInLoops: "Should warps be shown in loops? Ignored if warps or loops are disabled.",
      // Party
      partyName: "The name of the party you want to join",
      partyPassword: "The password of the party you want to join",
      // Debug       
      debug: "Enables/disables debug information",
      assetServerAddress: "The address of the server used to fetch map images and data",
      partyServerAddress: "The address of the party server"
    }
  };
  var loadCookies = () => {
    Object.keys(menuMetadata.structure).forEach((categoryName) => {
      menuMetadata.structure[categoryName].forEach((setting) => {
        const value = getCookie(`omoYnoMinimap_${setting.name}`);
        if (!value || value === "") return;
        let parsedValue = void 0;
        switch (setting.type) {
          case 2 /* Bool */:
            parsedValue = value === "true";
            break;
          case 0 /* Int */:
            parsedValue = parseInt(value);
            break;
          case 4 /* Percentage */:
            parsedValue = parseFloat(value);
            break;
          case 3 /* Text */:
            parsedValue = value;
            break;
          default:
            break;
        }
        if (parsedValue !== void 0) {
          values[setting.name] = parsedValue;
        }
      });
    });
  };
  var setSettingsModalVisbility = (visible) => {
    if (visible) {
      modalContainer?.classList.remove("hidden");
      settingsModal.classList.remove("hidden");
    } else {
      modalContainer?.classList.add("hidden");
      settingsModal.classList.add("hidden");
    }
  };
  var modalContainer = document.getElementById("modalContainer");
  var settingsModal = document.createElement("div");
  settingsModal.classList.add("modal");
  settingsModal.classList.add("hidden");
  var initSettingsModal = () => {
    const modalClose = document.createElement("button");
    modalClose.type = "button";
    modalClose.classList.add("modalClose");
    modalClose.textContent = "\u2716";
    modalClose.addEventListener("click", () => {
      setSettingsModalVisbility(false);
    });
    settingsModal.appendChild(modalClose);
    const modalHeader = document.createElement("div");
    modalHeader.classList.add("modalHeader");
    const modalTitle = document.createElement("h1");
    modalTitle.classList.add("modalTitle");
    modalTitle.textContent = "Minimap Settings";
    modalHeader.appendChild(modalTitle);
    settingsModal.appendChild(modalHeader);
    const modalContent = document.createElement("div");
    modalContent.classList.add("modalContent");
    const formControls = document.createElement("ul");
    const style = document.createElement("style");
    document.head.appendChild(style);
    style.innerHTML = `
        .omoSettingsInput {
            display: flex;
            justify-content: space-between;
            margin-left: auto;
        }
        .omoSettingsDiv {
            
        }
    `;
    Object.keys(menuMetadata.structure).forEach((category) => {
      const categoryHeader = document.createElement("h2");
      categoryHeader.textContent = category;
      categoryHeader.style.textTransform = "capitalize";
      formControls.appendChild(categoryHeader);
      menuMetadata.structure[category].forEach((setting) => {
        if (setting.name == "hideMinimap") return;
        const li = document.createElement("li");
        li.classList.add("formControlRow");
        const label = document.createElement("label");
        label.classList.add("unselectable");
        label.textContent = setting.name;
        li.appendChild(label);
        const div = document.createElement("div");
        div.classList.add("omoSettingsDiv");
        const getValue = () => values[setting.name];
        const setValue = (newValue) => values[setting.name] = newValue;
        switch (setting.type) {
          case 2 /* Bool */:
            const checkbox = document.createElement("button");
            checkbox.classList.add("checkboxButton");
            checkbox.classList.add("unselectable");
            checkbox.classList.add("omoSettingsInput");
            checkbox.appendChild(document.createElement("span"));
            if (getValue() === true) checkbox.classList.add("toggled");
            checkbox.addEventListener("click", () => {
              const newValue = !getValue();
              setValue(newValue);
              if (newValue) checkbox.classList.add("toggled");
              else checkbox.classList.remove("toggled");
              setCookie(`omoYnoMinimap_${setting.name}`, `${newValue}`);
              if (setting.onChanged) setting.onChanged();
            });
            div.appendChild(checkbox);
            break;
          case 3 /* Text */:
            const input = document.createElement("input");
            input.classList.add("omoSettingsInput");
            input.type = "text";
            if (setting.extra) input.pattern = setting.extra;
            input.value = getValue();
            input.addEventListener("input", () => {
              setValue(input.value);
              setCookie(`omoYnoMinimap_${setting.name}`, `${input.value}`);
            });
            input.appendChild(document.createElement("span"));
            div.appendChild(input);
            break;
          default:
            break;
        }
        li.appendChild(div);
        formControls.appendChild(li);
      });
    });
    modalContent.appendChild(formControls);
    settingsModal.appendChild(modalContent);
  };
  modalContainer?.appendChild(settingsModal);

  // src/pageutil.ts
  var createButton = (iconHtml, side, addBefore = void 0) => {
    const newButton = document.createElement("button");
    newButton.classList.add("iconButton");
    newButton.innerHTML = iconHtml;
    const controlsElement = document.getElementById(`${side}Controls`);
    if (addBefore) {
      controlsElement?.insertBefore(newButton, document.getElementById(addBefore));
    } else {
      controlsElement?.appendChild(newButton);
    }
    return newButton;
  };

  // version.json
  var version = 2;

  // src/main.ts
  var minimapButtonHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M4 12L20 12M12 4L12 20M6.2 20H17.8C18.9201 20 19.4802 20 19.908 19.782C20.2843 19.5903 20.5903 19.2843 20.782 18.908C21 18.4802 21 17.9201 21 16.8V7.2C21 6.0799 21 5.51984 20.782 5.09202C20.5903 4.71569 20.2843 4.40973 19.908 4.21799C19.4802 4 18.9201 4 17.8 4H6.2C5.0799 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.07989 3 7.2V16.8C3 17.9201 3 18.4802 3.21799 18.908C3.40973 19.2843 3.71569 19.5903 4.09202 19.782C4.51984 20 5.07989 20 6.2 20Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  var minimapSettingsHTML = '<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m9 5.5a1 1 90 0 0 0 7 1 1 90 0 0 0 -7m-7 5.5l-2-0.25v-3.5l2-0.25 0.75-1.5-1.25-1.75 2.25-2.25 1.75 1.25 1.5-0.75 0.25-2h3.5l0.25 2 1.5 0.75 1.75-1.25 2.25 2.25-1.25 1.75 0.75 1.5 2 0.25v3.5l-2 0.25-0.75 1.5 1.25 1.75-2.25 2.25-1.75-1.25-1.5 0.75-0.25 2h-3.5l-0.25-2-1.5-0.75-1.75 1.25-2.25-2.25 1.25-1.75-0.75-1.5"></path></svg>';
  var settingsButton = createButton(minimapSettingsHTML, "left" /* Left */);
  settingsButton.addEventListener("click", () => {
    setSettingsModalVisbility(true);
  });
  var minimapToggleButton = createButton(minimapButtonHTML, "right" /* Right */, "controls-fullscreen");
  minimapToggleButton.style.display = "";
  var extraLocationInfo = document.createElement("span");
  extraLocationInfo.classList.add("infoText");
  extraLocationInfo.classList.add("nofilter");
  extraLocationInfo.style.marginBottom = "8px";
  extraLocationInfo.style.display = "none";
  extraLocationInfo.style.textShadow = "2px 4px 4px black";
  canvas.after(extraLocationInfo);
  minimapToggleButton.onclick = () => {
    values.hideMinimap = !values.hideMinimap;
    updateVisbility();
    updateExtraLocationInfo();
  };
  var updateExtraLocationInfo = () => {
    const shouldBeVisible = values.extraLocationInfo && !values.hideMinimap;
    extraLocationInfo.style.display = shouldBeVisible ? "" : "none";
  };
  var wasGameLoaded = false;
  var update2 = () => {
    if (isGameLoaded()) {
      if (!wasGameLoaded) {
        wasGameLoaded = true;
        onGameLoaded2();
      }
      update();
      draw();
    }
    setTimeout(update2, 1e3 / values.updatesPerSecond);
  };
  var onGameLoaded2 = () => {
    loadCookies();
    initSettingsModal();
    onGameLoaded();
    const metadataUrl = `https://raw.githubusercontent.com/omoflop/ynominimap/refs/heads/main/version.json`;
    fetch(metadataUrl).then((response) => {
      if (!response.ok) throw new Error(`Failed to reach to asset server (${metadataUrl})`);
      return response.json();
    }).then((json) => {
      if (version < json.version) {
        showToastMessage("There is an update available for YnoMinimap! <a href='https://github.com/omoflop/ynominimap' target='_blank'>Download here</a>", "info", true, void 0, true);
      }
    }).catch((error) => {
      if (values.debug) console.error(error);
    });
    updateVisbility();
    updateExtraLocationInfo();
  };
  setTimeout(update2, 1e3 / values.updatesPerSecond);
  setInterval(() => {
    if (!isGameLoaded() || extraLocationInfo.style.display == "none") return;
    const [px, py] = getPlayerCoords();
    extraLocationInfo.textContent = `Map Id: ${getMapId()}, x: ${px}, y: ${py}`;
  }, 1e3 / 10);
})();
