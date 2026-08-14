function center(rect) {
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function overlaps(firstStart, firstSize, secondStart, secondSize) {
    return Math.min(firstStart + firstSize, secondStart + secondSize)
        > Math.max(firstStart, secondStart);
}

export function directionalNeighbor(layout, sourceId, direction) {
    const source = layout.get(sourceId);
    if (source == null) return null;
    const sourceCenter = center(source);
    let candidateId = null;
    let candidateScore = Infinity;

    for (const [windowId, rect] of layout) {
        if (windowId === sourceId) continue;
        const candidateCenter = center(rect);
        const horizontal = direction === "left" || direction === "right";
        const correctSide = direction === "left"
            ? candidateCenter.x < sourceCenter.x
            : direction === "right"
                ? candidateCenter.x > sourceCenter.x
                : direction === "up"
                    ? candidateCenter.y < sourceCenter.y
                    : candidateCenter.y > sourceCenter.y;
        const orthogonalOverlap = horizontal
            ? overlaps(source.y, source.height, rect.y, rect.height)
            : overlaps(source.x, source.width, rect.x, rect.width);
        if (!correctSide || !orthogonalOverlap) continue;

        const primaryDistance = horizontal
            ? Math.abs(candidateCenter.x - sourceCenter.x)
            : Math.abs(candidateCenter.y - sourceCenter.y);
        const orthogonalDistance = horizontal
            ? Math.abs(candidateCenter.y - sourceCenter.y)
            : Math.abs(candidateCenter.x - sourceCenter.x);
        const score = primaryDistance * 10000 + orthogonalDistance;
        if (score < candidateScore) {
            candidateId = windowId;
            candidateScore = score;
        }
    }
    return candidateId;
}
