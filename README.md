
# 🚀 PromptMaster AI Studio

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Gemini API](https://img.shields.io/badge/AI-Gemini%202.5-purple.svg)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind-38B2AC.svg)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)](https://web.dev/progressive-web-apps/)

**PromptMaster AI Studio** is an elite discovery engine and professional image laboratory. It scours the global web for trending AI prompt structures and provides a high-fidelity studio to generate, refine, and post-process artwork with granular precision.

## ✨ Core Capabilities

### 🌐 Neural Web Scan (Deep Discovery)
Unlike static generators, PromptMaster uses **Google Search Grounding** to perform real-time crawls. It identifies high-performing prompt architectures from Midjourney, DALL-E, and Stable Diffusion communities to give you "the internet's best" starting points.

### 🎨 Pro Studio Editor
A professional-grade post-processing suite with hardware-accelerated filters:
- **Primary Controls:** Brightness, Exposure, and Contrast (Black Point).
- **Color Mastery:** Hue Rotation, Saturation, and Chroma Vibrance.
- **Detailing:** Edge Sharpness and Neural Refinement.
- **History Tracking:** Full 25-step **Undo/Redo** functionality for non-destructive editing.

### ⚡ Neural Refiner
Directly communicate with the AI model to iterate on images. Provide instructions like *"Add cinematic golden hour lighting"* or *"Inject cyberpunk neon aesthetics"* to modify existing generations.

### 📱 Performance & PWA
- **PWA Ready:** Installable on iOS, Android, and ChromeOS.
- **Hardware Accelerated:** Uses GPU-backed CSS filters for 60fps adjustment previews.
- **Fault Tolerant:** Implements exponential backoff and circuit breakers to handle API throttling gracefully.

## 🛠️ Technical Stack
- **Framework:** React 19 (Modern Hooks & Architecture)
- **AI Engine:** Google Gemini 2.5 Series (Flash & Pro)
- **Search Logic:** Google Search Grounding API
- **Styling:** Tailwind CSS with Glassmorphism
- **State Management:** History-buffered state for Undo/Redo

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/prompt-master-ai.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file or set your environment variables:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. **Launch Development:**
   ```bash
   npm run dev
   ```

## 📸 Studio Preview
The app features a sophisticated "Dark Mode" by default with a "Bright Mode" toggle, designed to provide the best possible environment for color-accurate image evaluation.

---
*Built with ❤️ for the AI Art Community.*
