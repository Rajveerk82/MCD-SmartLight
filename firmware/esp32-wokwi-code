#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "time.h"

// ---------- CONFIG (edit as needed) ----------
#define WIFI_SSID     "Wokwi-GUEST"
#define WIFI_PASSWORD ""

#define DB_HOST       "server-8f7f2-default-rtdb.firebaseio.com" // without https://
#define DEVICE_ID     "SL001"

const uint32_t SEND_INTERVAL_MS = 5000; // 5-second sample rate
uint32_t lastSend = 0;

#define LED_PIN LED_BUILTIN        // Wokwi built-in LED (GPIO 2)

// NTP (Indian Standard Time)
const char *ntpServer = "pool.ntp.org";
const long  gmtOffset = 19800;     // +05:30
const int   daylightOffset = 0;

// ---------- TIME ----------
uint64_t epochMillis() {
  struct timeval tv;
  gettimeofday(&tv, nullptr);               // synced via NTP
  return (uint64_t)tv.tv_sec * 1000ULL + tv.tv_usec / 1000ULL;
}

// ---------- Firebase REST helpers ----------
String url(const String &path) {
  return "https://" + String(DB_HOST) + path;
}

void sendSnapshot(float V, float I, float P, float E) {
  HTTPClient http;
  StaticJsonDocument<256> doc;
  doc["voltage"]     = V;
  doc["current"]     = I;
  doc["power"]       = P;
  doc["energy"]      = E;
  doc["lastSeen"]    = epochMillis();
  doc["lastUpdated"] = epochMillis();
  String payload; serializeJson(doc, payload);

  http.begin(url("/devices/" DEVICE_ID ".json"));
  http.addHeader("Content-Type", "application/json");
  http.PATCH(payload);
  http.end();

  // also push to history
  http.begin(url("/history/" DEVICE_ID "/" + String(epochMillis()) + ".json"));
  http.addHeader("Content-Type", "application/json");
  http.PUT(payload);
  http.end();
}

void pollStatus() {
  HTTPClient http;
  http.begin(url("/devices/" DEVICE_ID "/status.json"));
  int code = http.GET();
  if (code == 200) {
    String s = http.getString();
    s.trim(); s.replace("\"", "");
    digitalWrite(LED_PIN, s == "on" ? HIGH : LOW);
  }
  http.end();
}

// ---------- SETUP ----------
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print('.');
  }
  Serial.println("\nWiFi connected!");

  configTime(gmtOffset, daylightOffset, ntpServer);
  Serial.println("NTP time sync requested…");
  // wait until time is obtained
  time_t now = 0;
  while (now < 1700000000) { // arbitrary past epoch
    delay(200);
    time(&now);
  }
  Serial.println("Time synced!");
}

// ---------- LOOP ----------
void loop() {
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    float V = random(220, 241);            // 220-240 V
    float I = random(10, 50) / 100.0;      // 0.10-0.49 A
    float P = V * I;                       // W
    float E = millis() / 100000.0;         // fake kWh

    sendSnapshot(V, I, P, E);
    pollStatus();
  }

  delay(10);
}
