# Hyprland Mapping

| Hyprland setting | Hypr Dwindle treatment |
| --- | --- |
| `general.gaps_in=2` | `gapsIn=2`; allocated between every sibling pair |
| `general.gaps_out=4` | `gapsOut=4`; allocated around a root layout |
| `dwindle.preserve_split=true` | Split node orientations persist after reflow |
| `dwindle.smart_split=false` | Opens use target aspect ratio; pointer cardinal orientation is not forced |
| `dwindle.smart_resizing=true` | Exposed configuration; live native-divider synchronization requires Plasma-session validation |
| `dwindle.precise_mouse_move=true` | Interactive reinsertion uses cardinal center/aspect placement |
| `dwindle.use_active_for_splits=true` | Active eligible tiled window is the opening target |
| `input.follow_mouse=2` | KWin global focus policy; active-target selection preserves placement determinism |
| `no_focus_fallback=true` | Directional focus leaves focus unchanged without a tiled neighbor |

The following are intentionally not claimed as script settings: workspace gaps,
border size, border resize policy, tearing, snap thresholds, axis events,
cursor hotspot padding, and global cursor warping. They are controlled by KWin
or Plasma input/compositor policy, not a layout script.
