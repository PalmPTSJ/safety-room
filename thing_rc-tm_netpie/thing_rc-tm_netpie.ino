#include <AuthClient.h>
#include <MicroGear.h>
#include <MQTTClient.h>
#include <SHA1.h>
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <EEPROM.h>
#include <ESP8266HTTPClient.h>

#define USE_SERIAL Serial

const char* ssid     = "palmpalmpalm5";
const char* password = "asdf1234";

/*const char* ssid     = "LENOVO-PC 7376";
const char* password = "8Y6049k/";
*/
/*
const char* appId    = "SafetyRoom";
const char* key      = "UXVCoKiscrvkKzY";
const char* secret   = "jJDC0YLf0jyCtth97ceTWFGlu";

ESP8266WiFiMulti WiFiMulti;

void getSensor() {
  if(WiFiMulti.run() != WL_CONNECTED) return;
  HTTPClient http;
  http.setAuthorization(key,secret);
  http.begin("https://api.netpie.io/topic/SafetyRoom/sensor"); //HTTP
  // start connection and send HTTP header
  int httpCode = http.GET();
  // httpCode will be negative on error
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      USE_SERIAL.println("Payload : "+payload);
      if(payload == "Success") {
        USE_SERIAL.println("Data saved successfully");
      }
      else {
        USE_SERIAL.println("Something wrong");
      }
    }
  } else {
    USE_SERIAL.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
}

void setup() {
  USE_SERIAL.begin(115200);
  USE_SERIAL.println("Test");
  WiFiMulti.addAP("palmpalmpalm5", "asdf1234");
}
void loop() {
  if (WiFiMulti.run() != WL_CONNECTED) {
    USE_SERIAL.println("WiFi is not connected ... trying to reconnect");
    WiFiMulti.addAP("palmpalmpalm5", "asdf1234");
    delay(1000);
  }
  else {
    getSensor();
  }
  delay(1000);
}
*/

#define APPID       "SafetyRoom"
#define GEARKEY     "UXVCoKiscrvkKzY"
#define GEARSECRET  "jJDC0YLf0jyCtth97ceTWFGlu"
#define SCOPE       "sonarSensor"
//#define LDR 13
//#define DHTPIN 16 
WiFiClient client;
AuthClient *authclient;
float float_value ;
int timer=0;


MicroGear microgear(client);
void onConnected(char *attribute, uint8_t* msg, unsigned int msglen) {
  Serial.println("Connected to NETPIE...");
  microgear.setName("sonarSensor");
}

void setup() {
  Serial.begin(115200);

  //Serial.println("X");
  //Serial1.begin(115200);
  
  microgear.on(CONNECTED,onConnected);
  Serial.println("Starting... Aaaaaa");

  //wifi connected
  if (WiFi.begin(ssid, password)) {
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      //Serial.print(".");
    }
 //check uart is connected.
  while (!Serial){
    ;
  }
  Serial.println("serial port connected");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    //uncomment the line below if you want to reset token -->
    //microgear.resetToken();
    microgear.init(GEARKEY, GEARSECRET, SCOPE);
    microgear.connect(APPID);
  }
}

int people = 0;
int sensor = 0;
void loop() {
  timer += 1;
  if(timer >= 50) {
    if (microgear.connected()) {
      microgear.loop();
      Serial.println("Connected, sending data");
      char ascii[32];
      sprintf(ascii,"%d %d",sensor,people);
      Serial.println(ascii);
      microgear.chat("server",ascii);
    }
    else {
      Serial.println("connection lost, reconnect...");
      microgear.connect(APPID);
    }
    timer = 0;
  }

  // read serial
  while(Serial.available() > 0) {
    int inByte = Serial.read();
    if(inByte < 128) {
      people = inByte;
    }
    else {
      sensor = inByte-128;
    }
    Serial.println(inByte);
  }
  delay(10);
}
