# Hypr Dwindle for KWin: Canonical Design Record

## Purpose

This project is a standalone KWin 6 script that aims to reproduce the useful
behavior of the user's live Hyprland `dwindle` layout, not to reproduce an
alternating binary tree such as Polonium's. The decisive requirement is
real-estate-aware automatic splitting: tall target tiles stack and wide target
tiles divide side-by-side.

The intended live environment has per-output virtual desktops, a 1200x1920
portrait `DP-2`, a 3440x1440 ultrawide `DP-3`, and a scaled internal display.
Each output/desktop pair has an independent tree.

## Authoritative Hyprland defaults

```lua
general.gaps_in = 2
general.gaps_out = 4
general.gaps_workspaces = 2
general.border_size = 3
general.resize_on_border = true
general.no_focus_fallback = true
general.allow_tearing = true
general.snap = { enabled = true, window_gap = 10, monitor_gap = 10, respect_gaps = true }

dwindle.preserve_split = true
dwindle.smart_split = false
dwindle.smart_resizing = true
dwindle.precise_mouse_move = true
dwindle.use_active_for_splits = true

input.follow_mouse = 2
input.off_window_axis_events = 3
cursor.hotspot_padding = 1
cursor.no_warps = false
```

The implemented script settings use the corresponding camel-case names and
retain Hyprland's effective `default_split_ratio=1`, `split_width_multiplier=1`,
and ratio range `0.1..1.9`.

## Layout rules

1. The first eligible normal window fills the root work area subject to outer
   gap. It is tiled; it is not put into KWin's maximized state.
2. Every later normal window targets the active eligible tiled window on its
   destination root. Only without a valid active target does it choose the
   nearest leaf to the cursor.
3. For normal opening with `smartSplit=false`, orientation is derived from the
   target leaf itself:

   ```text
   horizontal if width > height * splitWidthMultiplier
   vertical otherwise
   ```

   Therefore the portrait display initially stacks, while a wide ultrawide
   tile splits left/right.
4. Default ratio `1` means 50/50. `gapsIn=2` is reserved between siblings;
   `gapsOut=4` is reserved around a root.
5. Existing split orientation persists when `preserveSplit=true`. It is never
   recalculated merely because ancestor geometry later changes.
6. A close, output/desktop move, float, minimize, fullscreen, or pin-like
   transition removes the affected leaf, promotes its sibling, and reflows
   immediately. There are no intentional empty leaves.
7. Temporary float/minimize/fullscreen removal records the prior nearest split
   relationship. Restore reuses it when the sibling survives; otherwise it
   follows normal insertion.

## Precise pointer placement

Pointer-driven tiled moves use four cardinal regions: left, up, right, and
down. They never use top-left/top-right/bottom-left/bottom-right quadrants.

The classifier compares the cursor delta from the target center against the
target's own height/width slope boundary. Horizontal wins for a shallow delta;
vertical wins otherwise. The delta sign chooses the cardinal side.

Consequently, dropping onto the lower portion of the second window in a
side-by-side pair splits that second window top/bottom and inserts the moved
window below it. This is distinct from a normal application launch while
`smartSplit=false`.

## KWin ownership and lifecycle

- The script owns native tile roots for all output/desktop pairs.
- Existing eligible normal windows are adopted when the script starts.
- Special windows, panels, popups, transients, dialogs, internal surfaces,
  pinned/all-desktop windows, minimized windows, fullscreen windows, and fully
  maximized windows are excluded from normal tiling.
- The script uses KWin native tile geometry and window management rather than
  directly forcing frame rectangles.
- Interactive window movement parks the source leaf, reclaims its space, then
  reinserts using precise pointer placement at move completion.
- Directional focus considers only geometrically overlapping candidates on the
  requested side. If none exists it changes nothing, matching the requested
  no-focus-fallback behavior.

## Shortcut policy

The script registers stable KWin action names:

```text
HyprDwindleFocusLeft/Right/Up/Down
HyprDwindleMoveLeft/Right/Up/Down
HyprDwindleToggleFloat
HyprDwindleToggleMaximize
HyprDwindleToggleFullscreen
HyprDwindleAdjustSplitDecrease/Increase
HyprDwindleRebuildCurrentRoot
```

Direct defaults mirror the requested Hyprland chords: Super+arrows for focus,
Super+Shift+arrows for directional reinsert, Super+Alt+Space for float,
Super+D for maximize, Super+F for fullscreen, and Super+semicolon/apostrophe
for divider adjustment. The installer backs up and disables only KWin's
conflicting quick-tile, screen-move, and Show Desktop actions.

Workspace number bindings, fullscreen spoof, and a pin approximation remain
future work. The system currently has five desktops and must not silently
create desktops 6-10.

## Integration boundaries

Polonium may inform KWin API integration only. Its alternating layout behavior
is explicitly not a model for this engine.

The Caelestia sample is a disabled compatibility layer that proxies named KWin
actions via `org.kde.kglobalaccel`. It must not be enabled alongside direct
shortcuts that own the same chords.

DankMaterialShell is not inspected, modified, or integrated. A DMS port is
fourth-priority future work after reliable standalone tiling, shortcuts, and
optional Caelestia integration.

## Validation boundary

Pure geometry and lifecycle tests live in `tests/core/`. Live KWin validation
is intentionally deferred: the user has declared the current Plasma session
unsuitable and must restart it before this package is installed, enabled, or
tested against the compositor. See `session-validation.md`.
