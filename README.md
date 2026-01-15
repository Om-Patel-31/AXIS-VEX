# AXIS VEX Competition Starter

A starter kit for VEX V5 competition code plus a companion VS Code extension that scaffolds new projects from this template.

## What's inside
- Competition-ready skeleton in [src/main.cpp](src/main.cpp) with `pre_auton`, `autonomous`, and `usercontrol` hooks.
- Reusable control utilities:
  - [include/DriverControl.h](include/DriverControl.h) for multiple drive styles (arcade, tank, split arcade, curvature, single-stick) with expo curves and deadzones.
  - [include/PIDController.h](include/PIDController.h) for tuned PID loops with integral windup protection.
  - [include/OdometryTracker.h](include/OdometryTracker.h) for basic field-centric position tracking.
- VEX build system via [makefile](makefile) and [vex/mkenv.mk](vex/mkenv.mk).
- VS Code extension in [extension](extension) that adds a VEX sidebar, project creator, and build shortcuts.

## Requirements
- VEX V5 toolchain (vex-toolchain) available on PATH for `make` builds.
- VS Code with C/C++ extensions for IntelliSense.
- Node.js 18+ (only if you plan to build/package the VS Code extension).

## Build the robot code
1. Open a terminal at the repository root.
2. Run `make`.
3. The firmware binary is produced under `build/` (name comes from `$(PROJECT)` in the VEX makefiles). Transfer it to the V5 Brain with your usual workflow.

## Customize control logic
- Driver input shaping and drive modes: edit [include/DriverControl.h](include/DriverControl.h).
- Odometry position reset or preset: use `reset()` / `setPosition()` in [include/OdometryTracker.h](include/OdometryTracker.h).
- PID gains and tolerances: adjust constructor arguments and `tolerance` in [include/PIDController.h](include/PIDController.h).
- Add your autonomous and driver code inside the stubs in [src/main.cpp](src/main.cpp).

## VS Code extension (optional)
The [extension](extension) folder contains `vex-competition-starter`, a VS Code extension that creates new projects from this template.

Development steps:
1. `cd extension && npm install`
2. `npm run compile` (or `npm run watch` during development).
3. Press `F5` in VS Code to launch the Extension Development Host and test the VEX sidebar.
4. `npm run package` to produce a `.vsix` for distribution.

Key commands (accessible from the VEX activity bar):
- **Create New Project**: scaffolds a fresh copy of the template.
- **Open Project**: opens an existing VEX project folder.
- **Build Project**: runs `make` in the selected project directory.
- **Refresh Projects**: rescans recent and workspace folders for VEX projects.

## Project layout
- [src](src): competition entry point and robot logic.
- [include](include): helper classes for driver control, PID, and odometry.
- [vex](vex): toolchain environment files pulled from VEX.
- [build](build): build artifacts (ignored by Git).
- [extension](extension): VS Code extension source, assets, and templates.

## Quick notes
- The template assumes standard VEX V5 C++ API headers are available via the toolchain.
- If you duplicate this repo for a new robot, set your project name in `.vscode/vex_project_settings.json` after creation (handled automatically when using the extension).
- Keep joystick deadzones and expo values conservative at first; tune incrementally to match your drivetrain.
