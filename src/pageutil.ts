export enum ButtonSide {
    Left = "left", Right = "right"
}

export const createButton = (iconHtml : string, side : ButtonSide, addBefore : string | undefined = undefined) => {
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
}