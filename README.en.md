[中文版 README](./README.md)

# CubeCity: 2.5D Cartoon City-Building System

> A lightweight 2.5D city-building simulation game based on Three.js and Vue.

Welcome to CubeCity! This is a cartoon-style 2.5D city simulation game where you can build, manage, and expand your very own metropolis. Place buildings, lay down roads, and watch your city grow as you manage resources and expand your territory.

![Gameplay Demo](README/游玩时动图.gif)

## ✨ Core Features

*   **🏙️ Free Construction:** Place, move, and demolish various buildings and roads as you wish to create a unique cityscape.
*   **🧩 Strategic Planning:** Balance the development of Residential (R), Commercial (C), and Industrial (I) zones, while also considering Environment (E), Society (S), and Governance (G) for sustainable city growth.
*   **💰 Economic System:** Buildings automatically generate coins. Use these coins to construct new buildings, upgrade, or expand your territory.
*   **🔬 Tech Tree System:** Research technologies when buildings reach maximum level to enhance performance and city efficiency.
*   **📊 System Status:** Dynamic calculation of Power Grid, Transport, Security, and Environment statuses that affect city income.
*   **💾 Local Storage:** Your city progress is automatically saved locally, so you can continue building anytime.
*   **🎨 Cartoon Style:** Bright colors and cute cartoon models provide a relaxing and enjoyable visual experience.

| Interface Overview                             | City Corner                                   | Offline Storage                               |
| :--------------------------------------------- | :--------------------------------------------- | :------------------------------------------- |
| ![Interface Overview](README/界面总览.png) | ![A corner of the city](README/随意把玩城市.png) | ![Offline Storage](README/离线存储.png) |

## 🎮 Gameplay Overview

The game revolves around four main operation modes, allowing you to easily manage all aspects of your city:

*   **🔍 Select Mode (SELECT):**
    *   Click buildings to view details such as population, status, and output.
    *   Upgrade buildings when conditions are met to enhance their functions and output.
    *   Research tech trees for level 3 buildings to further improve performance.

*   **🏗️ Build Mode (BUILD):**
    *   Select the building you want from the left panel.
    *   Click on available land on the map to place buildings. Real-time model preview and highlight make operations intuitive.

*   **🚚 Relocate Mode (RELOCATE):**
    *   Select a built building, then click on an empty tile to relocate it easily.
    *   You can rotate the building before placement to fit your city layout.

*   **💣 Demolish Mode (DEMOLISH):**
    *   Switch to this mode and click unwanted buildings to demolish them.
    *   Demolishing returns part of the construction cost.

## 🛠️ Tech Stack

*   **Core Rendering:** [Three.js](https://threejs.org/)
*   **Frontend Framework:** [Vue 3](https://vuejs.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **UI & Styles:** [Tailwind CSS](https://tailwindcss.com/) & SCSS
*   **State Management:** [Pinia](https://pinia.vuejs.org/)
*   **Event Bus:** [mitt](https://github.com/developit/mitt)

## 📚 Documentation

*   **🎮 Player Guide:** [Game Guide](./docs/新手指南.md) - Detailed gameplay instructions and tips
*   **👨‍💻 Developer Guide:** [Developer Guide](./docs/新手开发指南.md) - Complete development environment setup and coding standards
*   **📋 Product Requirements:** [PRD Document](./docs/PRD.md) - Product requirements document
*   **🔧 Technical Design:** [TD Document](./docs/TD.md) - Technical design document

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Docker Deployment

```bash
docker run -d \
  --name cube-city \
  --restart always \
  -p 5141:5141 \
  cube-city:latest
```


## 📄 License

This project is licensed under the [MIT License](LICENSE).
