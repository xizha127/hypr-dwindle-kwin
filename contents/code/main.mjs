import { DwindleManager } from "./core/manager.mjs";
import { directionalNeighbor } from "./core/focus.mjs";
import { insetRect } from "./core/geometry.mjs";
import { loadSettings } from "./kwin/config.mjs";
import { isEligibleWindow, windowId } from "./kwin/window.mjs";

const HORIZONTAL = 1;
const VERTICAL = 2;

function childRects(node, rect, gapsIn) {
    const horizontal = node.orientation === "horizontal";
    const usable = Math.max(0, (horizontal ? rect.width : rect.height) - gapsIn);
    const firstSize = Math.floor(usable * (node.ratio / 2));
    const secondSize = usable - firstSize;
    return horizontal
        ? [
            { x: rect.x, y: rect.y, width: firstSize, height: rect.height },
            { x: rect.x + firstSize + gapsIn, y: rect.y, width: secondSize, height: rect.height },
        ]
        : [
            { x: rect.x, y: rect.y, width: rect.width, height: firstSize },
            { x: rect.x, y: rect.y + firstSize + gapsIn, width: rect.width, height: secondSize },
        ];
}

class Controller {
    constructor(api) {
        this.api = api;
        this.settings = loadSettings((key, fallback) => api.kwin.readConfig(key, fallback));
        this.manager = new DwindleManager(this.settings);
        this.windows = new Map();
        this.contexts = new Map();
        this.tileBindings = new Map();
        this.floating = new Set();
        this.moving = new Set();
        this.moveCandidates = new Set();
        this.pending = new Map();
        this.flushScheduled = false;
        this.rendering = false;
    }

    log(level, message) {
        if (this.settings.logLevel === "debug" || level !== "debug") {
            this.api.console.info(`hypr-dwindle: ${message}`);
        }
    }

    contextFor(window) {
        const output = window.output ?? this.api.workspace.activeScreen;
        const desktop = window.desktops?.[0] ?? this.api.workspace.currentDesktop;
        if (output == null || desktop == null) return null;
        const outputId = output.name ?? output.uuid ?? String(output);
        const desktopId = desktop.id ?? desktop.x11DesktopNumber ?? String(desktop);
        const key = `${outputId}:${desktopId}`;
        const context = { key, output, desktop };
        this.contexts.set(key, context);
        return context;
    }

    rootTile(context) {
        return this.api.workspace.rootTile(context.output, context.desktop);
    }

    rootRect(context) {
        const root = this.rootTile(context);
        return root == null ? null : insetRect(root.absoluteGeometry, this.settings.gapsOut);
    }

    activeWindowIdFor(context) {
        const active = this.api.workspace.activeWindow;
        if (active == null) return null;
        const id = windowId(active);
        return this.manager.rootFor(id) === context.key ? id : null;
    }

    shouldTile(window) {
        return isEligibleWindow(window)
            && !this.floating.has(windowId(window))
            && !this.moving.has(windowId(window));
    }

    queueWindow(window) {
        const id = windowId(window);
        this.windows.set(id, window);
        this.pending.set(id, window);
        if (this.flushScheduled) return;
        this.flushScheduled = true;
        this.api.qt.callLater(() => this.flush());
    }

    flush() {
        this.flushScheduled = false;
        const queued = Array.from(this.pending.values());
        this.pending.clear();
        for (const window of queued) this.reconcileWindow(window);
    }

    reconcileWindow(window) {
        const id = windowId(window);
        const priorKey = this.manager.rootFor(id);
        const context = this.contextFor(window);
        if (!this.shouldTile(window) || context == null) {
            if (priorKey != null) {
                this.manager.park(id);
                this.renderRoot(priorKey);
            }
            return;
        }
        const rootRect = this.rootRect(context);
        if (rootRect == null) return;
        if (priorKey === context.key) return;
        if (priorKey != null) {
            this.manager.detach(id);
            this.renderRoot(priorKey);
        }
        this.manager.restore(id, context.key, {
            rootRect,
            activeWindowId: this.settings.useActiveForSplits ? this.activeWindowIdFor(context) : null,
            cursorPos: this.api.workspace.cursorPos,
        });
        this.renderRoot(context.key);
    }

    renderRoot(rootKey) {
        const context = this.contexts.get(rootKey);
        if (context == null) return;
        const root = this.rootTile(context);
        const tree = this.manager.treeFor(rootKey);
        if (root == null) return;

        this.rendering = true;
        try {
            for (const [id, binding] of this.tileBindings) {
                if (binding.rootKey !== rootKey) continue;
                const window = this.windows.get(id);
                if (window != null && binding.tile != null) binding.tile.unmanage(window);
                this.tileBindings.delete(id);
            }
            while (root.tiles.length > 0) root.tiles[root.tiles.length - 1].remove();
            if (tree.root == null) {
                root.padding = 0;
                return;
            }
            if (tree.root.kind === "leaf") {
                root.padding = this.settings.gapsOut;
                this.bindLeaf(rootKey, root, tree.root.windowId);
                return;
            }
            root.padding = 0;
            this.renderNode(rootKey, root, tree.root, this.rootRect(context), root.absoluteGeometry);
        } finally {
            this.rendering = false;
        }
    }

    renderNode(rootKey, tile, node, rect, nativeRect) {
        if (node.kind === "leaf") {
            this.bindLeaf(rootKey, tile, node.windowId);
            return;
        }
        while (tile.tiles.length > 0) tile.tiles[tile.tiles.length - 1].remove();
        tile.layoutDirection = node.orientation === "horizontal" ? HORIZONTAL : VERTICAL;
        tile.split(tile.layoutDirection);
        const [firstRect, secondRect] = childRects(node, rect, this.settings.gapsIn);
        const childRectsList = [firstRect, secondRect];
        const childNodes = [node.first, node.second];
        for (let index = 0; index < 2; index += 1) {
            const child = tile.tiles[index];
            const childRect = childRectsList[index];
            child.relativeGeometry = this.api.qt.rect(
                childRect.x - nativeRect.x,
                childRect.y - nativeRect.y,
                childRect.width,
                childRect.height,
            );
            this.renderNode(rootKey, child, childNodes[index], childRect, childRect);
        }
    }

    bindLeaf(rootKey, tile, id) {
        const window = this.windows.get(id);
        if (window == null) return;
        tile.manage(window);
        this.tileBindings.set(id, { rootKey, tile });
    }

    removeWindow(window) {
        const id = windowId(window);
        const rootKey = this.manager.rootFor(id);
        if (rootKey != null) {
            this.manager.detach(id);
            this.renderRoot(rootKey);
        }
        this.windows.delete(id);
        this.floating.delete(id);
        this.moving.delete(id);
        this.moveCandidates.delete(id);
        this.pending.delete(id);
    }

    onMoveStarted(window) {
        const id = windowId(window);
        if (this.manager.rootFor(id) == null) return;
        this.moveCandidates.add(id);
    }

    onMoveStepped(window) {
        const id = windowId(window);
        if (!this.moveCandidates.has(id) || this.moving.has(id) || window.tile != null) return;
        this.moving.add(id);
        const rootKey = this.manager.rootFor(id);
        this.manager.park(id);
        this.renderRoot(rootKey);
    }

    onMoveFinished(window) {
        const id = windowId(window);
        this.moveCandidates.delete(id);
        if (!this.moving.delete(id)) return;
        const context = this.contextFor(window);
        if (context == null || !isEligibleWindow(window) || this.floating.has(id)) return;
        const rootRect = this.rootRect(context);
        if (rootRect == null) return;
        this.manager.place(id, context.key, {
            rootRect,
            cursorPos: this.api.workspace.cursorPos,
            precise: this.settings.preciseMouseMove,
        });
        this.renderRoot(context.key);
    }

    toggleFloat() {
        const window = this.api.workspace.activeWindow;
        if (window == null) return;
        const id = windowId(window);
        if (this.floating.has(id)) {
            this.floating.delete(id);
        } else {
            this.floating.add(id);
        }
        this.queueWindow(window);
    }

    toggleMaximize() {
        const window = this.api.workspace.activeWindow;
        if (window != null) window.setMaximize(!window.maximizedHorizontal, !window.maximizedVertical);
    }

    toggleFullscreen() {
        const window = this.api.workspace.activeWindow;
        if (window != null) window.fullScreen = !window.fullScreen;
    }

    focus(direction) {
        const window = this.api.workspace.activeWindow;
        if (window == null) return;
        const id = windowId(window);
        const rootKey = this.manager.rootFor(id);
        const context = this.contexts.get(rootKey);
        if (context == null) return;
        const targetId = directionalNeighbor(this.manager.layout(rootKey, this.rootRect(context)), id, direction);
        const target = targetId == null ? null : this.windows.get(targetId);
        if (target != null) this.api.workspace.activeWindow = target;
    }

    move(direction) {
        const window = this.api.workspace.activeWindow;
        if (window == null) return;
        const id = windowId(window);
        const rootKey = this.manager.rootFor(id);
        const context = this.contexts.get(rootKey);
        if (context == null) return;
        const rootRect = this.rootRect(context);
        const layout = this.manager.layout(rootKey, rootRect);
        const targetId = directionalNeighbor(layout, id, direction);
        const targetRect = targetId == null ? null : layout.get(targetId);
        if (targetRect == null) return;
        this.manager.detach(id);
        this.manager.place(id, rootKey, {
            rootRect,
            cursorPos: {
                x: direction === "left" ? targetRect.x + 1 : direction === "right" ? targetRect.x + targetRect.width - 1 : targetRect.x + targetRect.width / 2,
                y: direction === "up" ? targetRect.y + 1 : direction === "down" ? targetRect.y + targetRect.height - 1 : targetRect.y + targetRect.height / 2,
            },
            precise: true,
        });
        this.renderRoot(rootKey);
        this.api.workspace.activeWindow = window;
    }

    adjustSplit(delta) {
        const window = this.api.workspace.activeWindow;
        if (window == null) return;
        const id = windowId(window);
        const rootKey = this.manager.rootFor(id);
        if (rootKey == null || !this.manager.adjustRatio(id, delta)) return;
        this.renderRoot(rootKey);
    }

    rebuildCurrentRoot() {
        const window = this.api.workspace.activeWindow;
        if (window == null) return;
        const rootKey = this.manager.rootFor(windowId(window));
        if (rootKey != null) this.renderRoot(rootKey);
    }

    attachWindow(window) {
        const id = windowId(window);
        if (this.windows.has(id)) return;
        this.windows.set(id, window);
        window.closed.connect(() => this.removeWindow(window));
        window.desktopsChanged.connect(() => this.queueWindow(window));
        window.outputChanged.connect(() => this.queueWindow(window));
        window.fullScreenChanged.connect(() => this.queueWindow(window));
        window.minimizedChanged.connect(() => this.queueWindow(window));
        window.maximizedAboutToChange.connect(() => this.queueWindow(window));
        window.interactiveMoveResizeStarted.connect(() => this.onMoveStarted(window));
        window.interactiveMoveResizeStepped.connect(() => this.onMoveStepped(window));
        window.interactiveMoveResizeFinished.connect(() => this.onMoveFinished(window));
        this.queueWindow(window);
    }

    attachShortcuts() {
        const shortcuts = this.api.shortcuts;
        shortcuts.focusLeft.activated.connect(() => this.focus("left"));
        shortcuts.focusRight.activated.connect(() => this.focus("right"));
        shortcuts.focusUp.activated.connect(() => this.focus("up"));
        shortcuts.focusDown.activated.connect(() => this.focus("down"));
        shortcuts.moveLeft.activated.connect(() => this.move("left"));
        shortcuts.moveRight.activated.connect(() => this.move("right"));
        shortcuts.moveUp.activated.connect(() => this.move("up"));
        shortcuts.moveDown.activated.connect(() => this.move("down"));
        shortcuts.toggleFloat.activated.connect(() => this.toggleFloat());
        shortcuts.toggleMaximize.activated.connect(() => this.toggleMaximize());
        shortcuts.toggleFullscreen.activated.connect(() => this.toggleFullscreen());
        shortcuts.shrinkSplit.activated.connect(() => this.adjustSplit(-0.05));
        shortcuts.growSplit.activated.connect(() => this.adjustSplit(0.05));
        shortcuts.rebuild.activated.connect(() => this.rebuildCurrentRoot());
    }

    start() {
        this.api.workspace.windowAdded.connect((window) => this.attachWindow(window));
        this.api.workspace.windowRemoved.connect((window) => this.removeWindow(window));
        this.api.workspace.screensChanged.connect(() => this.rebuildAll());
        this.api.workspace.desktopsChanged.connect(() => this.rebuildAll());
        this.api.workspace.windowList().forEach((window) => this.attachWindow(window));
        this.attachShortcuts();
        this.log("info", "started");
    }

    rebuildAll() {
        for (const rootKey of this.contexts.keys()) this.renderRoot(rootKey);
    }
}

export function main(api) {
    const controller = new Controller(api);
    controller.start();
    return controller;
}
