export function automaticOrientation(rect, splitWidthMultiplier = 1) {
    return rect.width > rect.height * splitWidthMultiplier
        ? "horizontal"
        : "vertical";
}

export function cardinalDirection(rect, point) {
    const deltaX = point.x - (rect.x + rect.width / 2);
    const deltaY = point.y - (rect.y + rect.height / 2);

    if (Math.abs(deltaY) < Math.abs(deltaX) * rect.height / rect.width) {
        return deltaX < 0 ? "left" : "right";
    }

    return deltaY < 0 ? "up" : "down";
}
