#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include "time.h"

// ---------- CONFIG (edit as needed) ----------

#define WIFI_SSID     "Your_WiFi_SSID"        // Replace with your WiFi name
#define WIFI_PASSWORD "Your_WiFi_Password"    // Replace with your WiFi password

// for wokwi
// #define WIFI_SSID     "Wokwi-GUEST"
// #define WIFI_PASSWORD ""

#define DB_HOST       "server-8f7f2-default-rtdb.firebaseio.com" // without https://
#define DEVICE_ID     "SL001"

const uint32_t SEND_INTERVAL_MS = 5000; // 5-second sample rate
uint32_t lastSend = 0;

// Pin definitions
#define GREEN_LED_PIN    2    // WiFi status LED (Green when connected)
#define RED_LED_PIN      4    // Error/Status LED (optional)

// PZEM-004T v3.0 configuration
#define PZEM_RX_PIN     16    // Connect to TX of PZEM
#define PZEM_TX_PIN     17    // Connect to RX of PZEM

// Create PZEM004T instance with custom RX/TX pins
PZEM004Tv30 pzem(PZEM_RX_PIN, PZEM_TX_PIN);

// NTP (Indian Standard Time)
const char *ntpServer = "pool.ntp.org";
const long  gmtOffset = 19800;     // +05:30 (5.5 hours in seconds)
const int   daylightOffset = 0;

// Variables to store sensor readings
float voltage = 0.0;
float current = 0.0;
float power = 0.0;
float energy = 0.0;
float frequency = 0.0;
float pf = 0.0;

// WiFi connection status
bool wifiConnected = false;

// ---------- TIME ----------
uint64_t epochMillis() {
  struct timeval tv;
  gettimeofday(&tv, nullptr);
  return (uint64_t)tv.tv_sec * 1000ULL + tv.tv_usec / 1000ULL;
}

// ---------- WiFi Management ----------
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    digitalWrite(GREEN_LED_PIN, HIGH); // Turn on green LED
    Serial.println();
    Serial.println("WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    wifiConnected = false;
    digitalWrite(GREEN_LED_PIN, LOW); // Turn off green LED
    Serial.println();
    Serial.println("WiFi connection failed!");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiConnected) {
      Serial.println("WiFi disconnected!");
      wifiConnected = false;
      digitalWrite(GREEN_LED_PIN, LOW); // Turn off green LED
    }
    
    // Try to reconnect
    connectWiFi();
  } else {
    if (!wifiConnected) {
      wifiConnected = true;
      digitalWrite(GREEN_LED_PIN, HIGH); // Turn on green LED
      Serial.println("WiFi reconnected!");
    }
  }
}

// ---------- PZEM Reading Functions ----------
bool readPZEMData() {
  voltage = pzem.voltage();
  current = pzem.current();
  power = pzem.power();
  energy = pzem.energy();
  frequency = pzem.frequency();
  pf = pzem.pf();

// for wokwi
  // float voltage = random(220, 241);            // 220-240 V
  // float current = random(10, 50) / 100.0;      // 0.10-0.49 A
  // float power = V * current;                       // W
  // float energy = random(30, 50);         // fake kWh
  // float pf = random(10, 50);
  
  // Check if readings are valid
  if (isnan(voltage) || isnan(current) || isnan(power) || isnan(energy)) {
    Serial.println("Error reading PZEM data!");
    return false;
  }
  
  return true;
}

void printPZEMData() {
  Serial.println("=== PZEM-004T Readings ===");
  Serial.printf("Voltage: %.2f V\n", voltage);
  Serial.printf("Current: %.3f A\n", current);
  Serial.printf("Power: %.2f W\n", power);
  Serial.printf("Energy: %.3f kWh\n", energy);
  Serial.printf("Frequency: %.1f Hz\n", frequency);
  Serial.printf("Power Factor: %.2f\n", pf);
  Serial.println("========================");
}

// ---------- Firebase REST helpers ----------
String url(const String &path) {
  return "https://" + String(DB_HOST) + path;
}

void sendSnapshot(float V, float I, float P, float E) {
  if (!wifiConnected) {
    Serial.println("WiFi not connected, skipping data send");
    return;
  }
  
  HTTPClient http;
  http.setTimeout(10000); // 10 second timeout
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["voltage"] = V;
  doc["current"] = I;
  doc["power"] = P;
  doc["energy"] = E;
  doc["frequency"] = frequency;
  doc["powerFactor"] = pf;
  doc["lastSeen"] = epochMillis();
  doc["lastUpdated"] = epochMillis();
  doc["deviceId"] = DEVICE_ID;
  
  String payload;
  serializeJson(doc, payload);
  
  // Send to main device endpoint
  Serial.println("Sending data to Firebase...");
  http.begin(url("/devices/" DEVICE_ID ".json"));
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.PATCH(payload);
  if (httpCode > 0) {
    Serial.printf("Device data sent, HTTP code: %d\n", httpCode);
  } else {
    Serial.printf("Error sending device data: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
  
  // Send to history
  http.begin(url("/history/" DEVICE_ID "/" + String(epochMillis()) + ".json"));
  http.addHeader("Content-Type", "application/json");
  
  httpCode = http.PUT(payload);
  if (httpCode > 0) {
    Serial.printf("History data sent, HTTP code: %d\n", httpCode);
  } else {
    Serial.printf("Error sending history data: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void pollStatus() {
  if (!wifiConnected) {
    return;
  }
  
  HTTPClient http;
  http.setTimeout(5000); // 5 second timeout
  http.begin(url("/devices/" DEVICE_ID "/status.json"));
  
  int code = http.GET();
  if (code == 200) {
    String s = http.getString();
    s.trim();
    s.replace("\"", "");
    
    // Control device based on status (if needed)
    if (s == "on") {
      // Device should be on
      Serial.println("Device status: ON");
    } else {
      // Device should be off  
      Serial.println("Device status: OFF");
    }
  } else if (code > 0) {
    Serial.printf("Status poll HTTP code: %d\n", code);
  } else {
    Serial.printf("Status poll error: %s\n", http.errorToString(code).c_str());
  }
  
  http.end();
}

// ---------- SETUP ----------
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== ESP32 PZEM-004T Energy Monitor ===");
  
  // Initialize LED pins
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  
  // Initialize PZEM
  Serial.println("Initializing PZEM-004T...");
  // Reset energy if needed (uncomment next line to reset)
  // pzem.resetEnergy();
  
  // Connect to WiFi
  connectWiFi();
  
  if (wifiConnected) {
    // Configure NTP
    configTime(gmtOffset, daylightOffset, ntpServer);
    Serial.println("Requesting NTP time sync...");
    
    // Wait for time synchronization
    time_t now = 0;
    int attempts = 0;
    while (now < 1700000000 && attempts < 20) { // Wait max 4 seconds
      delay(200);
      time(&now);
      attempts++;
    }
    
    if (now >= 1700000000) {
      Serial.println("NTP time synchronized!");
    } else {
      Serial.println("NTP sync timeout, continuing anyway...");
    }
  }
  
  Serial.println("Setup complete!");
  Serial.println("Reading PZEM data every 5 seconds...");
}

// ---------- MAIN LOOP ----------
void loop() {
  // Check WiFi connection status
  checkWiFiConnection();
  
  // Read and send data at specified interval
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    
    // Read data from PZEM sensor
    if (readPZEMData()) {
      // Print data to serial monitor
      printPZEMData();
      
      // Send data to Firebase if WiFi is connected
      if (wifiConnected) {
        sendSnapshot(voltage, current, power, energy);
        pollStatus();
      } else {
        Serial.println("WiFi disconnected, skipping data transmission");
      }
    } else {
      Serial.println("Failed to read PZEM data, check wiring!");
      digitalWrite(RED_LED_PIN, HIGH);
      delay(100);
      digitalWrite(RED_LED_PIN, LOW);
    }
    
    Serial.println(); // Empty line for readability
  }
  
  delay(100); // Small delay to prevent watchdog issues
}
