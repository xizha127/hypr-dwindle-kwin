import { DwindleTree } from "./tree.mjs";

function squaredDistanceToRect(point, rect) {
    const x = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
    const y = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
    const dx = point.x - x;
    const dy = point.y - y;
    return dx * dx + dy * dy;
}

export class DwindleManager {
    constructor(settings = {}) {
        this.settings = settings;
        this.trees = new Map();
        this.windowRoots = new Map();
        this.parked = new Map();
    }

    treeFor(rootKey) {
        let tree = this.trees.get(rootKey);
        if (tree == null) {
            tree = new DwindleTree(this.settings);
            this.trees.set(rootKey, tree);
        }
        return tree;
    }

    rootFor(windowId) {
        const rootKey = this.windowRoots.get(windowId);
        return rootKey == null ? null : rootKey;
    }

    place(windowId, rootKey, {
        rootRect,
        activeWindowId = null,
        cursorPos = null,
        precise = this.settings.smartSplit === true,
    }) {
        const previousRoot = this.rootFor(windowId);
        if (previousRoot != null) this.detach(windowId);

        const tree = this.treeFor(rootKey);
        let targetId = tree.has(activeWindowId) ? activeWindowId : null;
        if (targetId == null && tree.leafCount > 0 && cursorPos != null) {
            targetId = this.nearestWindow(tree.layout(rootRect), cursorPos);
        }
        tree.insert(windowId, {
            targetId,
            targetRect: targetId == null ? rootRect : tree.layout(rootRect).get(targetId),
            point: cursorPos,
            precise,
        });
        this.windowRoots.set(windowId, rootKey);
    }

    detach(windowId) {
        const rootKey = this.rootFor(windowId);
        if (rootKey == null) return false;
        const tree = this.trees.get(rootKey);
        if (tree != null) tree.remove(windowId);
        this.windowRoots.delete(windowId);
        return true;
    }

    park(windowId) {
        const rootKey = this.rootFor(windowId);
        if (rootKey == null) return false;
        const tree = this.treeFor(rootKey);
        const placement = tree.placementContext(windowId);
        this.parked.set(windowId, {
            rootKey,
            siblingId: placement == null ? null : placement.siblingId,
            orientation: placement == null ? null : placement.orientation,
            ratio: placement == null ? null : placement.ratio,
            newFirst: placement == null ? null : placement.newFirst,
        });
        return this.detach(windowId);
    }

    restore(windowId, rootKey, { rootRect, activeWindowId = null, cursorPos = null } = {}) {
        const parked = this.parked.get(windowId);
        const tree = this.treeFor(rootKey);
        if (parked != null && parked.rootKey === rootKey && parked.siblingId != null && tree.has(parked.siblingId)) {
            tree.insert(windowId, {
                targetId: parked.siblingId,
                targetRect: tree.layout(rootRect).get(parked.siblingId),
                orientation: parked.orientation,
                newFirst: parked.newFirst,
                ratio: parked.ratio,
            });
            this.windowRoots.set(windowId, rootKey);
        } else {
            this.place(windowId, rootKey, { rootRect, activeWindowId, cursorPos });
        }
        this.parked.delete(windowId);
    }

    layout(rootKey, rootRect) {
        return this.treeFor(rootKey).layout(rootRect);
    }

    adjustRatio(windowId, delta) {
        const rootKey = this.rootFor(windowId);
        return rootKey == null ? false : this.treeFor(rootKey).adjustRatio(windowId, delta);
    }

    nearestWindow(layout, point) {
        let nearest = null;
        let nearestDistance = Infinity;
        for (const [windowId, rect] of layout) {
            const distance = squaredDistanceToRect(point, rect);
            if (distance < nearestDistance) {
                nearest = windowId;
                nearestDistance = distance;
            }
        }
        return nearest;
    }
}
