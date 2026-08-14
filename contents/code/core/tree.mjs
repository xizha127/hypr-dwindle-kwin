import { automaticOrientation, cardinalDirection } from "./placement.mjs";

function leaf(windowId) {
    return { kind: "leaf", windowId };
}

function split(orientation, ratio, first, second) {
    return { kind: "split", orientation, ratio, first, second };
}

function copiedSplit(node, first, second, ratio = node.ratio) {
    return {
        kind: "split",
        orientation: node.orientation,
        ratio,
        first,
        second,
    };
}

function ratioFraction(ratio) {
    return ratio / 2;
}

function contains(node, windowId) {
    if (node == null) return false;
    if (node.kind === "leaf") return node.windowId === windowId;
    return contains(node.first, windowId) || contains(node.second, windowId);
}

function removeLeaf(node, windowId) {
    if (node == null) return null;
    if (node.kind === "leaf") return node.windowId === windowId ? null : node;

    const first = removeLeaf(node.first, windowId);
    const second = removeLeaf(node.second, windowId);
    if (first == null) return second;
    if (second == null) return first;
    return copiedSplit(node, first, second);
}

function replaceLeaf(node, targetId, replacement) {
    if (node.kind === "leaf") {
        return node.windowId === targetId ? replacement : node;
    }
    return copiedSplit(
        node,
        replaceLeaf(node.first, targetId, replacement),
        replaceLeaf(node.second, targetId, replacement),
    );
}

function countLeaves(node) {
    if (node == null) return 0;
    if (node.kind === "leaf") return 1;
    return countLeaves(node.first) + countLeaves(node.second);
}

function firstLeafId(node) {
    if (node == null) return null;
    return node.kind === "leaf" ? node.windowId : firstLeafId(node.first);
}

function placementContext(node, windowId) {
    if (node == null || node.kind === "leaf") return null;
    if (node.first.kind === "leaf" && node.first.windowId === windowId) {
        return {
            siblingId: firstLeafId(node.second),
            orientation: node.orientation,
            ratio: node.ratio,
            newFirst: true,
        };
    }
    if (node.second.kind === "leaf" && node.second.windowId === windowId) {
        return {
            siblingId: firstLeafId(node.first),
            orientation: node.orientation,
            ratio: node.ratio,
            newFirst: false,
        };
    }
    const first = placementContext(node.first, windowId);
    return first != null ? first : placementContext(node.second, windowId);
}

function adjustNearestSplit(node, windowId, delta, minimum, maximum) {
    if (node == null || node.kind === "leaf") {
        return { node, adjusted: false };
    }
    if ((node.first.kind === "leaf" && node.first.windowId === windowId)
        || (node.second.kind === "leaf" && node.second.windowId === windowId)) {
        return {
            node: copiedSplit(node, node.first, node.second, Math.min(maximum, Math.max(minimum, node.ratio + delta))),
            adjusted: true,
        };
    }

    const first = adjustNearestSplit(node.first, windowId, delta, minimum, maximum);
    if (first.adjusted) {
        return { node: copiedSplit(node, first.node, node.second), adjusted: true };
    }
    const second = adjustNearestSplit(node.second, windowId, delta, minimum, maximum);
    return second.adjusted
        ? { node: copiedSplit(node, node.first, second.node), adjusted: true }
        : { node, adjusted: false };
}

export class DwindleTree {
    constructor({
        gapsIn = 2,
        splitWidthMultiplier = 1,
        defaultSplitRatio = 1,
        ratioMinimum = 0.1,
        ratioMaximum = 1.9,
    } = {}) {
        this.gapsIn = gapsIn;
        this.splitWidthMultiplier = splitWidthMultiplier;
        this.defaultSplitRatio = defaultSplitRatio;
        this.ratioMinimum = ratioMinimum;
        this.ratioMaximum = ratioMaximum;
        this.root = null;
    }

    get leafCount() {
        return countLeaves(this.root);
    }

    has(windowId) {
        return contains(this.root, windowId);
    }

    insert(windowId, {
        targetId,
        targetRect,
        point,
        precise = false,
        orientation: forcedOrientation = null,
        newFirst: forcedNewFirst = null,
        ratio: forcedRatio = null,
    } = {}) {
        if (this.root == null) {
            this.root = leaf(windowId);
            return;
        }
        if (targetId == null || !this.has(targetId)) {
            throw new Error("A valid targetId is required for a non-empty tree");
        }

        const direction = precise && point != null
            ? cardinalDirection(targetRect, point)
            : null;
        const orientation = forcedOrientation != null ? forcedOrientation : (direction === "left" || direction === "right"
            ? "horizontal"
            : direction === "up" || direction === "down"
                ? "vertical"
                : automaticOrientation(targetRect, this.splitWidthMultiplier));
        const isHorizontal = orientation === "horizontal";
        const center = isHorizontal
            ? targetRect.x + targetRect.width / 2
            : targetRect.y + targetRect.height / 2;
        const coordinate = point == null ? null : (isHorizontal ? point.x : point.y);
        const newFirst = forcedNewFirst != null ? forcedNewFirst : (direction === "left" || direction === "up"
            ? true
            : direction === "right" || direction === "down"
                ? false
                : coordinate != null && coordinate < center);
        const replacement = newFirst
            ? split(orientation, forcedRatio != null ? forcedRatio : this.defaultSplitRatio, leaf(windowId), leaf(targetId))
            : split(orientation, forcedRatio != null ? forcedRatio : this.defaultSplitRatio, leaf(targetId), leaf(windowId));
        this.root = replaceLeaf(this.root, targetId, replacement);
    }

    remove(windowId) {
        this.root = removeLeaf(this.root, windowId);
    }

    placementContext(windowId) {
        return placementContext(this.root, windowId);
    }

    adjustRatio(windowId, delta) {
        const result = adjustNearestSplit(
            this.root,
            windowId,
            delta,
            this.ratioMinimum,
            this.ratioMaximum,
        );
        this.root = result.node;
        return result.adjusted;
    }

    walk(rect, visit) {
        const visitNode = (node, nodeRect) => {
            if (node == null) return;
            visit(node, nodeRect);
            if (node.kind === "leaf") {
                return;
            }

            const horizontal = node.orientation === "horizontal";
            const primarySize = horizontal ? nodeRect.width : nodeRect.height;
            const usableSize = Math.max(0, primarySize - this.gapsIn);
            const firstSize = Math.floor(usableSize * ratioFraction(node.ratio));
            const secondSize = usableSize - firstSize;
            const firstRect = horizontal
                ? { x: nodeRect.x, y: nodeRect.y, width: firstSize, height: nodeRect.height }
                : { x: nodeRect.x, y: nodeRect.y, width: nodeRect.width, height: firstSize };
            const secondRect = horizontal
                ? { x: nodeRect.x + firstSize + this.gapsIn, y: nodeRect.y, width: secondSize, height: nodeRect.height }
                : { x: nodeRect.x, y: nodeRect.y + firstSize + this.gapsIn, width: nodeRect.width, height: secondSize };
            visitNode(node.first, firstRect);
            visitNode(node.second, secondRect);
        };
        visitNode(this.root, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    }

    layout(rect) {
        const result = new Map();
        this.walk(rect, (node, nodeRect) => {
            if (node.kind === "leaf") result.set(node.windowId, nodeRect);
        });
        return result;
    }
}
