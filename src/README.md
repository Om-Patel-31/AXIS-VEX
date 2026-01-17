# `src` README

Purpose: Quick orientation for developers working in `src/` and `include/`.

Build
- From project root run:

```powershell
make
```

- If `make` fails, inspect `vex/mkenv.mk` and the root `makefile` for toolchain settings.

Where to edit
- `src/main.cpp`: entry point for autonomous and driver control — change routines and call sites here.
- `include/*.h`: constants, motor port assignments, PID controllers, and helper classes.

Common edits
- Map motors and sensors to your robot by changing port constants in `include/DriverControl.h`.
- Tune PID gains in `include/PIDController.h`.
- Update odometry wheel sizes/offsets in `include/OdometryTracker.h`.

Testing tips
- Edit one hardware mapping at a time and compile.
- For motors, run brief, low-power commands to confirm wiring.

If you prefer, I can generate a `config.h` file containing all hardware constants in one place — tell me your motor and sensor ports.
