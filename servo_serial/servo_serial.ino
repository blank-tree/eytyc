#include <LSS.h>
#include <SoftwareSerial.h>
SoftwareSerial servoSerial(8, 9);

#define LSS_BAUD  (LSS_DefaultBaud)

LSS motors[8];
const int MAX_MOTOR_POS = 1800;
const int MAX_MOVE_TIME = 9999;

const unsigned int MAX_MESSAGE_LENGTH = 12;

void setup() {
  for (int i = 0; i < 8; i++) {
    motors[i] = LSS(i + 1);
  }

  Serial.begin(9600);
  servoSerial.begin(LSS_BAUD);
  LSS::initBus(servoSerial, LSS_BAUD);

  delay(500);

  for (int i = 0; i < 8; i++) {
    motors[i].move(0);
    motors[i].setColorLED(4);
    //motors[i].setColorLED(0);
  }
}

void loop() {

  //Check to see if anything is available in the serial receive buffer
  while (Serial.available() > 0) {
   //Create a place to hold the incoming message
   static char message[MAX_MESSAGE_LENGTH];
   static unsigned int message_pos = 0;

   //Read the next available byte in the serial receive buffer
   char inByte = Serial.read();

   //Message coming in (check not terminating character) and guard for over message size
   if ( inByte != '\n' && (message_pos < MAX_MESSAGE_LENGTH - 1) ) {
     //Add the incoming byte to our message
     message[message_pos] = inByte;
     message_pos++;
   } else {
     //Full message received...
     //Add null character to string
     message[message_pos] = '\0';

     String servoCMD = String(message);

     //Reset for the next message
     message_pos = 0;

      // String Structure
      // 1-1800-2000
      // {motorID}-{position}-{time}
      // example: move motor 1 to 180 degrees in 2 seconds

     int motorID = servoCMD.substring(0, 1).toInt();
     int pos = servoCMD.substring(2, 6).toInt();
     int moveTime = servoCMD.substring(7).toInt();

     if (motorID >= 1 && motorID <= 8 
      && pos >= 0 && pos <= MAX_MOTOR_POS 
      && moveTime >= 0 && moveTime <= 9999) {
        // move motor
        motors[motorID - 1].moveT(-pos, moveTime);
        Serial.println("move motor " + String(motorID) + " to pos " + String(pos) + " in " + String(moveTime) + "ms");
      } else {
        Serial.println("WRONG COMMAND");
      }
    }
  }
}
