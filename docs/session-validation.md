# Session Validation Gate

Do not install, enable, or test this script against the current Plasma session.
The user has explicitly marked that session unsuitable and will restart Plasma
before authorizing validation.

After that authorization, validate in this order without restarting KWin:

1. Install the package with `tools/install-hypr-dwindle`.
2. On the 1200x1920 output, open two normal windows and verify a top/bottom split.
3. On the 3440x1440 output, open two normal windows and verify a left/right split.
4. Drag onto each cardinal region, especially the lower region of the second
   side-by-side window.
5. Close, float, minimize, fullscreen, move, and restore windows; verify no
   unused tile remains.
6. Test every direct shortcut and then `tools/restore-hypr-dwindle`.

Record KWin journal output and resulting native root-tile geometry for any
failure before changing the implementation.
