#ifndef DRIVERCONTROL_H
#define DRIVERCONTROL_H

#include "vex.h"
#include <cmath>

// Control scheme types
enum class ControlType {
  ARCADE,           // Left stick Y = drive, Right stick X = turn
  TANK,             // Left stick Y = left side, Right stick Y = right side
  SPLIT_ARCADE,     // Left stick Y = drive, Left stick X = turn
  CURVATURE,        // Arcade with velocity-based turn scaling
  SINGLE_STICK      // Single stick: Y = drive, X = turn
};

class DriverControl {
private:
  ControlType controlType;
  int deadzone;
  double exponent;
  int turnSensitivity;
  int slowTurnSensitivity;
  
  // Apply deadzone to joystick input
  int applyDeadzone(int value) {
    return (std::abs(value) < deadzone) ? 0 : value;
  }
  
  // Apply exponential curve to input
  double applyCurve(double inputPercent, double expo) {
    double v = std::fmin(std::fmax(inputPercent, -100.0), 100.0);
    double sign = (v >= 0.0) ? 1.0 : -1.0;
    double absNorm = std::abs(v) / 100.0;
    double shaped = std::pow(absNorm, expo) * 100.0;
    return sign * shaped;
  }
  
  // Clamp value to -100 to 100
  double clamp(double value) {
    return std::fmin(std::fmax(value, -100.0), 100.0);
  }

public:
  DriverControl(ControlType type = ControlType::ARCADE, 
                int deadzoneThreshold = 10,
                double inputExponent = 2.0,
                int turnSens = 60,
                int slowTurnSens = 50)
    : controlType(type),
      deadzone(deadzoneThreshold),
      exponent(inputExponent),
      turnSensitivity(turnSens),
      slowTurnSensitivity(slowTurnSens) {}
  
  // Calculate motor outputs based on controller input
  void calculate(vex::controller& controller, double& leftOutput, double& rightOutput, bool slowTurn = false) {
    int drivePower = 0;
    int turnPower = 0;
    
    switch (controlType) {
      case ControlType::ARCADE:
        // Left stick Y = drive, Right stick X = turn
        drivePower = applyDeadzone(controller.Axis3.position(vex::percent));
        turnPower = applyDeadzone(controller.Axis1.position(vex::percent));
        break;
        
      case ControlType::TANK:
        // Left stick Y = left side, Right stick Y = right side
        {
          int leftPower = applyDeadzone(controller.Axis3.position(vex::percent));
          int rightPower = applyDeadzone(controller.Axis2.position(vex::percent));
          leftOutput = applyCurve(leftPower, exponent);
          rightOutput = applyCurve(rightPower, exponent);
          return; // Tank doesn't use drive/turn combination
        }
        
      case ControlType::SPLIT_ARCADE:
        // Left stick Y = drive, Left stick X = turn
        drivePower = applyDeadzone(controller.Axis3.position(vex::percent));
        turnPower = applyDeadzone(controller.Axis4.position(vex::percent));
        break;
        
      case ControlType::CURVATURE:
        // Arcade with velocity-based turn scaling
        drivePower = applyDeadzone(controller.Axis3.position(vex::percent));
        turnPower = applyDeadzone(controller.Axis1.position(vex::percent));
        // Scale turn based on velocity for better control at low speeds
        if (std::abs(drivePower) > 5) {
          turnPower = (int)(turnPower * (1.0 - std::abs(drivePower) / 200.0));
        }
        break;
        
      case ControlType::SINGLE_STICK:
        // Right stick only: Y = drive, X = turn
        drivePower = applyDeadzone(controller.Axis2.position(vex::percent));
        turnPower = applyDeadzone(controller.Axis1.position(vex::percent));
        break;
    }
    
    // Apply turn sensitivity
    int activeTurnSens = slowTurn ? slowTurnSensitivity : turnSensitivity;
    int scaledTurn = (turnPower * activeTurnSens) / 100;
    
    // Apply expo curve
    double targetDrive = applyCurve(drivePower, exponent);
    double targetTurn = applyCurve(scaledTurn, exponent);
    
    // Calculate final outputs
    leftOutput = clamp(targetDrive + targetTurn);
    rightOutput = clamp(targetDrive - targetTurn);
  }
  
  // Setters for adjusting parameters on the fly
  void setControlType(ControlType type) { controlType = type; }
  void setDeadzone(int value) { deadzone = value; }
  void setExponent(double value) { exponent = value; }
  void setTurnSensitivity(int value) { turnSensitivity = value; }
  void setSlowTurnSensitivity(int value) { slowTurnSensitivity = value; }
  
  // Getters
  ControlType getControlType() const { return controlType; }
  int getDeadzone() const { return deadzone; }
  double getExponent() const { return exponent; }
  int getTurnSensitivity() const { return turnSensitivity; }
  int getSlowTurnSensitivity() const { return slowTurnSensitivity; }
};

#endif // DRIVERCONTROL_H
