export const isGameLoaded = () => 
    typeof gameId !== "undefined" && 
    typeof cachedMapId !== "undefined" && 
    typeof easyrpgPlayer !== "undefined" && 
    typeof easyrpgPlayer.api !== "undefined" && 
    typeof playerData !== "undefined" && 
    typeof playerData?.name !== "undefined";

export const getGameId = () => gameId;
export const getMapId = () => cachedMapId;
export const getPlayerCoords = () => easyrpgPlayer.api.getPlayerCoords();
export const getPrevMapId = () => typeof cachedPrevMapId !== "undefined" ? cachedPrevMapId : "0000";
export const getUsername = () => playerData.name;