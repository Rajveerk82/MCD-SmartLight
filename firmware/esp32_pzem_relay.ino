/*
  ESP32 PZEM-004T Smart Street Light Controller

  - Reads voltage, current, power, energy from a PZEM-004T sensor (Modbus RTU)
  - Publishes data to Firebase Realtime Database under /devices/{DEVICE_ID}
  - Listens for command changes under /devices/{DEVICE_ID}/command to toggle relay ON/OFF
  - Updates status field accordingly ("on" or "off") and clears command after execution

  Hardware connections:
    * ESP32         PZEM-004T (TTL)
      RX2 (GPIO16)  -> TX (PZEM)
      TX2 (GPIO17)  -> RX (PZEM)
      5V            -> Vcc
      GND           -> GND

    * Relay module:  IN pin connected to GPIO RELAY_PIN (defaults to 4)

  Required libraries:
    - WiFi.h (built-in)
    - Firebase_ESP_Client (by Mobizt)
    - PZEM004Tv30 (by olehs / tobozo)
    - ArduinoJson (dependency of Firebase lib)

  Make sure to install these from the Arduino Library Manager.
*/

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <PZEM004Tv30.h>

/*************  USER CONFIGURATION  ****************/
// Wi-Fi credentials
#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase project configuration
#define API_KEY       "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL  "YOUR_DATABASE_URL"      // e.g. https://your-project-id.firebaseio.com
#define DEVICE_ID     "YOUR_DEVICE_ID"         // Unique ID matching entry in database

// Relay configuration
const uint8_t RELAY_PIN = 4;          // GPIO controlling relay module (LOW = ON for most modules)
const bool RELAY_ACTIVE_LEVEL = LOW;  // Change to HIGH if your relay is active-high

// Measurement interval (milliseconds)
const unsigned long MEASUREMENT_INTERVAL = 5000;
/***************************************************/

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// PZEM over Serial2 (GPIO16/17)
PZEM004Tv30 pzem(&Serial2, 16, 17); // RX, TX

unsigned long lastMeasurement = 0;

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.print("\nConnected! IP address: ");
  Serial.println(WiFi.localIP());
}

void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Anonymous sign-in — database rules must allow it or use email/password tokens
  auth.user.email = "";
  auth.user.password = "";

  Firebase.reconnectNetwork(true);

  Serial.println("Initializing Firebase...");
  Firebase.begin(&config, &auth);

  // Optional: Keep connection alive with autoReconnect
  config.timeout.serverResponse = 10000; // 10s
}

void streamCallback(FirebaseStream data);
void streamTimeoutCallback(bool timeout);

void setupStreamListener() {
  String path = String("/devices/") + DEVICE_ID + "/command";
  if (!Firebase.RTDB.beginStream(&fbdo, path.c_str())) {
    Serial.printf("Could not begin stream: %s\n", fbdo.errorReason().c_str());
    return;
  }
  Firebase.RTDB.setStreamCallback(&fbdo, streamCallback, streamTimeoutCallback);
  Serial.println("Listening for command changes...");
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600); // PZEM default baud rate

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, !RELAY_ACTIVE_LEVEL); // default OFF

  connectWiFi();
  setupFirebase();
  setupStreamListener();
}

void loop() {
  // Ensure WiFi/Firebase connectivity
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (Firebase.ready() && (millis() - lastMeasurement >= MEASUREMENT_INTERVAL)) {
    lastMeasurement = millis();
    publishMeasurements();
  }

  // Yield to background tasks
  delay(10);
}

void publishMeasurements() {
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power   = pzem.power();
  float energy  = pzem.energy();

  // Validate readings; if any value is NaN, treat as missing data
  bool invalidReadings = isnan(voltage) || isnan(current) || isnan(power) || isnan(energy);
  if (invalidReadings) {
    Serial.println("[WARN] Invalid PZEM reading, reporting zeros and setting error flag");
    voltage = 0;
    current = 0;
    power   = 0;
    energy  = 0;
  }

  // Build the JSON payload
  FirebaseJson payload;
  payload.set("voltage", voltage);
  payload.set("current", current);
  payload.set("power", power);
  payload.set("energy", energy);
  payload.set("lastSeen", millis()); // or use time from an RTC/NTP if available

  // Add / clear error field so that dashboard can raise an alert
  if (invalidReadings) {
    payload.set("error", "Sensor read failed");
  } else {
    // Clear previous error by setting empty string (falsy value in JS)
    payload.set("error", "");
  }

  String path = String("/devices/") + DEVICE_ID;
  if (Firebase.RTDB.updateNode(&fbdo, path.c_str(), &payload)) {
    Serial.println("Measurements uploaded");
  } else {
    Serial.printf("Upload failed: %s\n", fbdo.errorReason().c_str());
  }
}

// --- Firebase stream callbacks ---
void streamCallback(FirebaseStream data) {
  Serial.println("\n[Firebase] Command update received");
  if (!data.dataTypeEnum() == fb_esp_rtdb_data_type_null) {
    String cmd = data.stringData();

    if (cmd.equalsIgnoreCase("on")) {
      setRelay(true);
    } else if (cmd.equalsIgnoreCase("off")) {
      setRelay(false);
    }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    // Stream timed out, resume
    Serial.println("[Firebase] Stream timed out, resuming...");
    fbdo.resumeStream();
  }
}

void setRelay(bool turnOn) {
  digitalWrite(RELAY_PIN, turnOn ? RELAY_ACTIVE_LEVEL : !RELAY_ACTIVE_LEVEL);

  // Update device status in database
  String path = String("/devices/") + DEVICE_ID;
  FirebaseJson updateJson;
  updateJson.set("status", turnOn ? "on" : "off");
  updateJson.set("lastUpdated", millis());

  if (Firebase.RTDB.updateNode(&fbdo, path.c_str(), &updateJson)) {
    Serial.printf("Relay turned %s and status updated\n", turnOn ? "ON" : "OFF");
  } else {
    Serial.printf("Failed to update status: %s\n", fbdo.errorReason().c_str());
  }

  // Clear the command so UI shows empty after execution
  String cmdPath = String("/devices/") + DEVICE_ID + "/command";
  Firebase.RTDB.deleteNode(&fbdo, cmdPath.c_str());
}