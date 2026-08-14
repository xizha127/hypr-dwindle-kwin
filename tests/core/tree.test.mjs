import test from "node:test";
import assert from "node:assert/strict";

import { DwindleTree } from "../../contents/code/core/tree.mjs";

test("a portrait target splits top to bottom at fifty-fifty", () => {
    const tree = new DwindleTree();
    const root = { x: 0, y: 0, width: 1200, height: 1920 };

    tree.insert("first", { targetRect: root });
    tree.insert("second", {
        targetId: "first",
        targetRect: root,
        point: { x: 600, y: 1700 },
    });

    assert.deepEqual(tree.layout(root), new Map([
        ["first", { x: 0, y: 0, width: 1200, height: 959 }],
        ["second", { x: 0, y: 961, width: 1200, height: 959 }],
    ]));
});

test("removing a tiled client promotes its sibling into all usable space", () => {
    const tree = new DwindleTree();
    const root = { x: 4, y: 4, width: 1192, height: 1912 };

    tree.insert("first", { targetRect: root });
    tree.insert("second", {
        targetId: "first",
        targetRect: root,
        point: { x: 600, y: 1700 },
    });
    tree.remove("first");

    assert.deepEqual(tree.layout(root), new Map([
        ["second", root],
    ]));
    assert.equal(tree.leafCount, 1);
});

test("a precise lower drop splits the target vertically even when the target is wide", () => {
    const tree = new DwindleTree();
    const root = { x: 0, y: 0, width: 1000, height: 600 };

    tree.insert("first", { targetRect: root });
    tree.insert("second", {
        targetId: "first",
        targetRect: root,
        point: { x: 750, y: 500 },
        precise: true,
    });

    assert.deepEqual(tree.layout(root), new Map([
        ["first", { x: 0, y: 0, width: 1000, height: 299 }],
        ["second", { x: 0, y: 301, width: 1000, height: 299 }],
    ]));
});

test("adjusting a split cannot make a tiled leaf narrower than the configured ratio limit", () => {
    const tree = new DwindleTree({ ratioMinimum: 0.1, ratioMaximum: 1.9 });
    const root = { x: 0, y: 0, width: 1000, height: 600 };

    tree.insert("first", { targetRect: root });
    tree.insert("second", { targetId: "first", targetRect: root });
    tree.adjustRatio("first", -5);

    assert.deepEqual(tree.layout(root).get("first"), {
        x: 0, y: 0, width: 49, height: 600,
    });
});

test("walk emits the root and leaf rectangles used by the renderer", () => {
    const tree = new DwindleTree();
    const root = { x: 0, y: 0, width: 1000, height: 600 };
    tree.insert("first", { targetRect: root });
    tree.insert("second", { targetId: "first", targetRect: root });
    const visited = [];

    tree.walk(root, (node, rect) => visited.push([node.kind, rect]));

    assert.deepEqual(visited, [
        ["split", root],
        ["leaf", { x: 0, y: 0, width: 499, height: 600 }],
        ["leaf", { x: 501, y: 0, width: 499, height: 600 }],
    ]);
});
