# MCD SmartLight Web Dashboard

An interactive web dashboard for monitoring and controlling **MCD SmartLight** IoT devices.  
The project is built with **React** (Vite), leverages **Firebase** for authentication, and communicates with ESP32-based firmware over standard HTTP/MQTT endpoints.

---

## ✨ Features

1. **Real-time Device Status** – View current voltage, current, power and energy metrics reported by each SmartLight node.
2. **Device Management** – Add new devices, update device details and remove defective units.
3. **Alerts & Notifications** – Immediate visual alerts when a device exceeds user-defined thresholds.
4. **Scheduling** – Create automation schedules to switch lights on/off at specific times or based on sensor data.
5. **Authentication** – Secure email/password sign-up & login using Firebase Authentication.
6. **Light / Dark Theme** – Toggle between light and dark UI themes.
7. **Responsive UI** – Works seamlessly on desktop, tablet and mobile screens.

---

## 🗂️ Project Structure

```
MCD Web/
├── src/                # React source code
│   ├── components/     # Re-usable UI components
│   ├── contexts/       # React Context providers (Auth, Theme)
│   ├── pages/          # Route-level pages (Dashboard, Devices, …)
│   ├── firebase/       # Firebase SDK configuration
│   └── App.js          # Main application component
├── public/             # Static assets served as-is
├── firmware/           # ESP32 firmware (Arduino sketch)
├── build/              # Production build output (after `npm run build`)
├── package.json        # Project metadata & scripts
└── README.md           # You are here 📖
```

---

## 🚀 Quick Start (Local Development)

> Prerequisites: Node.js ≥ 16, npm ≥ 8

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open your browser
#    The app will be running at http://localhost:5173/ (default Vite port)
```

Any change in the `src/` directory triggers **hot-module reload** (HMR), so the browser refreshes instantly.

---

## 🔐 Environment Configuration

Create a `.env` file in the project root and add your Firebase credentials:

```env
VITE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_PROJECT_ID=your-project-id
VITE_STORAGE_BUCKET=your-project.appspot.com
VITE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
VITE_APP_ID=1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxxxxxxxx
```

The React app reads these values through `import.meta.env`.

---

## 🏗️ Production Build & Deployment

1. Build optimized static assets:

   ```bash
   npm run build
   ```

   The output will be generated in the `build/` directory.

2. **Serve** the build locally to verify:

   ```bash
   npm run preview
   ```

3. **Deploy Options**:

   • **GitHub Pages** – The repository already contains a `gh-pages` configuration. Push the `build/` folder to the `gh-pages` branch or automate using GitHub Actions.  
   • **Vercel / Netlify** – Import the repo, set the build command to `npm run build` and output folder to `build`.  
   • **Custom Server (NGINX, Apache)** – Copy the contents of `build/` to your server’s web root.

---

## 🔌 Firmware (ESP32)

The `firmware/esp32_pzem_relay.ino` sketch reads power metrics via the PZEM-004T module and controls a relay channel.  
It exposes REST endpoints such as:

```
GET  /api/metrics        # Returns JSON payload of voltage/current/power/energy
POST /api/relay/on       # Turns the light on
POST /api/relay/off      # Turns the light off
```

Feel free to adapt Wi-Fi SSID, password and MQTT broker settings inside the firmware.

---

## 🧪 Running Tests (optional)

The current project does not include automated tests. You can integrate **Jest + React Testing Library** for unit/component tests and **Cypress** for end-to-end testing.

---

## 📜 License

This project is released under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 🧭 Roadmap

- [ ] Add unit & integration tests  
- [ ] Add multi-language support (i18n)  
- [ ] Implement OAuth (Google Sign-In, GitHub)  
- [ ] Live OTA firmware update handling via the dashboard

---

## 💬 Questions?

Create an issue on GitHub or reach out to **@Rajveerk82**.

Enjoy building with **MCD SmartLight**! ✨