<<<<<<< HEAD
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/07d3d681-4ab1-4b5e-965a-0349e50ed0b0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
=======

# CrisisCore AI

CrisisCore AI is an intelligent disaster-response and emergency coordination platform designed to help victims, rescuers, and administrators communicate and respond rapidly during natural disasters such as floods, landslides, earthquakes, and urban emergencies.

The platform provides real-time SOS alerts, tactical rescue dashboards, live rescue tracking, safe shelter navigation, danger-zone visualization, AI-powered emergency analysis, and coordinated rescue operations through an intuitive modern interface.

---

# 🌍 Features

## 🚨 Smart SOS System

* Victims can instantly send emergency alerts
* Includes severity level, trapped duration, people count, and situational briefing
* AI-assisted emergency prioritization

## 🛰 Tactical GIS Map

* Interactive disaster-response map
* Real-time victim markers
* Flood and danger-zone overlays
* Safe shelter visualization
* Route assistance to shelters

## 🛟 Rescuer Mission Control

* Live rescue dashboard
* Priority-based alert sorting
* Rescue acceptance system
* ETA calculation
* Victim details and mission briefing

## 🏥 Shelter Intelligence

* Displays safe shelters with realistic occupancy/capacity
* Nearby relief center discovery
* Dynamic shelter routing

## 🤖 AI Integration

* Gemini AI powered crisis analysis
* Smart rescue scoring
* Emergency guidance generation
* Risk prioritization

## 📡 Real-Time Communication

* Firebase Firestore + Realtime Database synchronization
* Live updates for victims and rescuers
* Real-time mission status tracking

---

# 🛠 Tech Stack

* React + TypeScript
* Vite
* Firebase Authentication
* Firebase Firestore
* Firebase Realtime Database
* Leaflet Maps
* Tailwind CSS
* Framer Motion
* Google Gemini AI

---

# 📱 User Roles

## Victim

* Send SOS requests
* View rescue progress
* Track assigned rescuer and ETA
* Find nearby shelters

## Rescuer

* Accept rescue missions
* View tactical map
* Access victim details
* Resolve rescue operations

## Admin (Planned)

* Monitor disaster zones
* Manage shelters
* Coordinate large-scale response

---

# 🔥 Future Enhancements

* Offline emergency transmission
* Mesh-network fallback communication
* Drone integration
* Multi-disaster support
* Predictive flood-risk AI
* SMS fallback alerts
* Rescue analytics dashboard

---

# ⚡ Installation

```bash
npm install
npm run dev
```

---

# 🚀 Deployment

```bash
npm run build
firebase deploy
```

---

# 🔐 Environment Variables

Create a `.env` file:

```env
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

# 📌 Project Vision

CrisisCore AI aims to become a next-generation disaster coordination ecosystem that improves rescue speed, reduces response delays, and enhances emergency communication during critical situations.

---

# 👨‍💻 Developer

Developed by Swasthik M S
>>>>>>> 15387225648494cb095e6eb551b1a2421c28f806
