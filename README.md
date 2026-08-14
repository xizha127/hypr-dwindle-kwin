# Hypr Dwindle for KWin

An experimental KWin 6 script that recreates the relevant parts of the user's
Hyprland `dwindle` behavior: active-target insertion, aspect-aware automatic
splits, cardinal pointer placement, and a no-empty-leaf binary layout tree.

## Current behavior

- A tall target, including the 1200x1920 portrait output, splits top/bottom.
- A wide target, including an ultrawide output, splits left/right.
- New windows split the active eligible tiled window first (`useActiveForSplits`),
  with nearest-cursor fallback only when no active target exists.
- `preciseMouseMove` uses left/up/right/down regions based on the same
  center-and-aspect rule as Hyprland; it does not use corner quadrants.
- Closing, floating, minimizing, fullscreening, or moving a tiled client
  collapses its branch so no empty tile remains.
- The project defines KGlobalAccel actions for focus, directional reinsert,
  float, maximize, fullscreen, and divider adjustment.

## Install and configure

The package is deliberately disabled by default. Do not install it alongside
another active tiler.

```bash
./tools/install-hypr-dwindle
./tools/hypr-dwindle-config show
./tools/hypr-dwindle-config set gapsIn 2
```

`install-hypr-dwindle` makes a timestamped backup of the active tiler states
and the seven KWin shortcut entries it takes over. `restore-hypr-dwindle`
restores those scoped entries. It does not overwrite an entire later `kwinrc`.

## Important boundaries

This script owns the layout only. Plasma/KWin owns border thickness,
border-resize policy, tearing, cursor warping, `follow_mouse=2`, snapping, and
virtual-desktop spacing. See `docs/hyprland-mapping.md` for the full mapping.

The `integration/caelestia/` sample is inactive and is not installed. Enable
either it or direct script shortcuts—not both for the same chords.

No DankMaterialShell integration is included.
