export const clamp = (a : number, min : number, max : number) => {
    if (a > max) return max;
    if (a < min) return min;
    return a;
};

export const dist = (x1 : number, x2 : number, y1 : number, y2 : number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const lerp = (start : number, goal : number, delta : number) => {
    return start + (goal - start) * delta;
};

export const approach = (val : number, goal : number, step : number) => {
    return val < goal ? Math.min(goal, val + step) : Math.max(goal, val - step);
};

export const wrapText = (text : string, maxCharsPerLine : number = 16) => {
    const words : Array<string> = text.split(' ');
    const lines : Array<string> = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;

        if (testLine.length > maxCharsPerLine && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) lines.push(currentLine);
    
    return lines;
};

export const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
};