#ifndef DRIVERCONTROL_H
# define DRIVERCONTROL_H

# include "vex.h"
# include <cmath>

// Control scheme types
enum class ControlType
{
	ARCADE,
	TANK,
	SPLIT_ARCADE,
	CURVATURE,
	SINGLE_STICK
};

class DriverControl
{
  private:
	ControlType controlType;
	int deadzone;
	double exponent;
	int turnSensitivity;
	int slowTurnSensitivity;

	// Axis mapping (1..4)
	int axisDrive; // default Axis3
	int axisTurn;  // default Axis1
	int axisLeft;  // default Axis3 (for tank)
	int axisRight; // default Axis2 (for tank)

	// Apply deadzone to joystick input
	int applyDeadzone(int value)
	{
		return ((std::abs(value) < deadzone) ? 0 : value);
	}

	// Read configured axis from controller (returns percent)
	int readAxis(vex::controller &controller, int axisId)
	{
		switch (axisId)
		{
		case 1:
			return (controller.Axis1.position(vex::percent));
		case 2:
			return (controller.Axis2.position(vex::percent));
		case 3:
			return (controller.Axis3.position(vex::percent));
		case 4:
			return (controller.Axis4.position(vex::percent));
		default:
			return (0);
		}
	}

	// Apply exponential curve to input
	double applyCurve(double inputPercent, double expo)
	{
		double v = std::fmin(std::fmax(inputPercent, -100.0), 100.0);
		double sign = (v >= 0.0) ? 1.0 : -1.0;
		double absNorm = std::abs(v) / 100.0;
		double shaped = std::pow(absNorm, expo) * 100.0;
		return (sign * shaped);
	}

	// Clamp value to -100 to 100
	double clamp(double value)
	{
		return (std::fmin(std::fmax(value, -100.0), 100.0));
	}

  public:
	// New ctor allows passing axis mapping (defaults to original mapping)
	DriverControl(ControlType type = ControlType::ARCADE,
		int deadzoneThreshold = 10, double inputExponent = 2.0,
		int turnSens = 60, int slowTurnSens = 50, int axisDrive_ = 3,
		int axisTurn_ = 1, int axisLeft_ = 3,
		int axisRight_ = 2) : controlType(type), deadzone(deadzoneThreshold),
		exponent(inputExponent), turnSensitivity(turnSens),
		slowTurnSensitivity(slowTurnSens), axisDrive(axisDrive_),
		axisTurn(axisTurn_), axisLeft(axisLeft_), axisRight(axisRight_)
	{
	}

	// Calculate motor outputs based on controller input
	void calculate(vex::controller &controller, double &leftOutput,
		double &rightOutput, bool slowTurn = false)
	{
		int drivePower = 0;
		int turnPower = 0;

		switch (controlType)
		{
		case ControlType::ARCADE:
			drivePower = applyDeadzone(readAxis(controller, axisDrive));
			turnPower = applyDeadzone(readAxis(controller, axisTurn));
			break ;

		case ControlType::TANK:
		{
			int leftPower = applyDeadzone(readAxis(controller, axisLeft));
			int rightPower = applyDeadzone(readAxis(controller, axisRight));
			leftOutput = applyCurve(leftPower, exponent);
			rightOutput = applyCurve(rightPower, exponent);
			return ;
		}

		case ControlType::SPLIT_ARCADE:
			drivePower = applyDeadzone(readAxis(controller, axisDrive));
			turnPower = applyDeadzone(readAxis(controller, axisTurn));
			break ;

		case ControlType::CURVATURE:
			drivePower = applyDeadzone(readAxis(controller, axisDrive));
			turnPower = applyDeadzone(readAxis(controller, axisTurn));
			if (std::abs(drivePower) > 5)
			{
				turnPower = (int)(turnPower * (1.0 - std::abs(drivePower)
							/ 200.0));
			}
			break ;

		case ControlType::SINGLE_STICK:
			drivePower = applyDeadzone(readAxis(controller, axisDrive));
			turnPower = applyDeadzone(readAxis(controller, axisTurn));
			break ;
		}

		int activeTurnSens = slowTurn ? slowTurnSensitivity : turnSensitivity;
		int scaledTurn = (turnPower * activeTurnSens) / 100;

		double targetDrive = applyCurve(drivePower, exponent);
		double targetTurn = applyCurve(scaledTurn, exponent);

		leftOutput = clamp(targetDrive + targetTurn);
		rightOutput = clamp(targetDrive - targetTurn);
	}

	// Setters for adjusting parameters on the fly
	void setControlType(ControlType type)
	{
		controlType = type;
	}
	void setDeadzone(int value)
	{
		deadzone = value;
	}
	void setExponent(double value)
	{
		exponent = value;
	}
	void setTurnSensitivity(int value)
	{
		turnSensitivity = value;
	}
	void setSlowTurnSensitivity(int value)
	{
		slowTurnSensitivity = value;
	}

	// Axis setters/getters
	void setAxisDrive(int a)
	{
		axisDrive = a;
	}
	void setAxisTurn(int a)
	{
		axisTurn = a;
	}
	void setAxisLeft(int a)
	{
		axisLeft = a;
	}
	void setAxisRight(int a)
	{
		axisRight = a;
	}

	ControlType getControlType() const
	{
		return (controlType);
	}
	int getDeadzone() const
	{
		return (deadzone);
	}
	double getExponent() const
	{
		return (exponent);
	}
	int getTurnSensitivity() const
	{
		return (turnSensitivity);
	}
	int getSlowTurnSensitivity() const
	{
		return (slowTurnSensitivity);
	}
};

#endif // DRIVERCONTROL_H
