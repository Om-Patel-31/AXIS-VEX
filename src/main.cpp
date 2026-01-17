/*----------------------------------------------------------------------------*/
/*                                                                            */
/*    Module:       main.cpp                                                  */
/*    Author:       om31d                                                     */
/*    Created:      1/12/2026, 1:20:40 PM                                     */
/*    Description:  V5 project                                                */
/*                                                                            */
/*----------------------------------------------------------------------------*/

#include "vex.h"
#include "DriverControl.h"
#include "OdometryTracker.h"
#include "PIDController.h"

using namespace vex;

competition Competition;

// Device declarations
controller Controller1 = controller(primary);
motor leftFront = motor(PORT1);
motor leftBack = motor(PORT2);
motor rightFront = motor(PORT3);
motor rightBack = motor(PORT4);
inertial imu = inertial(PORT10);

// Custom class instances
DriverControl driverControl(ControlType::ARCADE, 10, 2.0, 60, 50);
OdometryTracker odometry;
PIDController drivePID(1.0, 0.0, 0.1);
PIDController turnPID(1.5, 0.0, 0.2);


void pre_auton(void) {
  leftFront.setBrake(brake);
  leftBack.setBrake(brake);
  rightFront.setBrake(brake);
  rightBack.setBrake(brake);
  
  imu.calibrate();
  waitUntil(!imu.isCalibrating());
  
  odometry.reset();
}

void autonomous(void) {

}

void usercontrol(void) {
  while (true) {
    double leftPower, rightPower;
    driverControl.calculate(Controller1, leftPower, rightPower);
    
    leftFront.spin(forward, leftPower, percent);
    leftBack.spin(forward, leftPower, percent);
    rightFront.spin(forward, rightPower, percent);
    rightBack.spin(forward, rightPower, percent);
    
    wait(20, msec);
  }
}

int main() {
  Competition.autonomous(autonomous);
  Competition.drivercontrol(usercontrol);
  
  pre_auton();
  
  while (true) {
    wait(100, msec);
  }
}
