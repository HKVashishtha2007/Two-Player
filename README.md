# ⚽ Pixel Football Showdown — 1v1 Retro Football Game

A complete, playable, browser-based 2D pixel-art football game with retro arcade aesthetics, crisp pixel graphics, smart AI, responsive ball physics, and Web Audio API synthesized sound effects.

Play directly in your browser on desktop, tablet, or mobile!

---

## 🎮 Play Modes

1. **Single Player (1 Player vs CPU)**:
   - Challenge the computer opponent powered by a state-based football AI.
   - 3 Difficulty settings:
     - **Easy (Rookie)**: Slower pace, casual shooting, generous space.
     - **Medium (Pro)**: Balanced tracking, clears dangerous balls from own box, takes shots on open angles.
     - **Hard (Legend)**: Predictive ball interception, charged rocket power shots, aggressive tackles, tight goal line defense.

2. **Two Players (Local 1v1 on Same Keyboard)**:
   - Compete against a friend side-by-side on the same keyboard with full simultaneous multi-key tracking.
   - Player 1 (Blue Team) attacks to the right; Player 2 (White/Custom Team) attacks to the left.

---

## 🕹️ Controls Guide

### 👤 Player 1 (Left Team)
| Action | Key |
|---|---|
| **Move Up / Down / Left / Right** | `W`, `A`, `S`, `D` |
| **Kick / Shoot** | `F` (Tap for quick shot) |
| **Charged Power Shot** | `HOLD F` (Fills overhead power bar, release to launch rocket drive!) |
| **Sprint / Dash Burst** | `Shift` or `Space` |

### 👥 Player 2 (Right Team)
| Action | Key |
|---|---|
| **Move Up / Down / Left / Right** | `▲`, `◄`, `▼`, `►` (Arrow Keys) |
| **Kick / Shoot** | `L` (Tap for quick shot) |
| **Charged Power Shot** | `HOLD L` (Fills overhead power bar, release to launch!) |
| **Sprint / Dash Burst** | `Enter` or `Right Shift` |

### 🌐 Global Hotkeys
- **Pause Match**: `Escape` or `P`
- **Toggle Sound Mute**: `M`

### 📱 Mobile / Touch Controls
- **Virtual 8-Direction D-Pad** on bottom-left of screen.
- **Large Action Buttons** on bottom-right:
  - Red **KICK** button (Tap or hold to charge power shot)
  - Blue **DASH** button (Sprint boost)

---

## ✨ Features & Visual Details

- **Retro 16-Bit Stadium Atmosphere**:
  - Purple-blue pixel city skyline with lighted skyscraper windows and radio antennas.
  - Drifting pixel clouds and twinkling night stars.
  - Stadium floodlight towers casting volumetric light beams onto the turf.
  - Brown wooden fence with individual planks, grain, and nails along the top touchline.
  - Animated pixel crowd/spectators bobbing and waving flags behind the fence.
- **Accurate 2.5D Football Pitch**:
  - Emerald green lawn with alternating mowed grass stripes.
  - Official markings: touchlines, center circle, halfway line, penalty boxes, 6-yard boxes, penalty spots, corner arcs, and waving corner flags.
  - Realistic 2.5D goals with 3D mesh nets, white posts, crossbar height, and dynamic net ripple on goal impact.
- **Arcade Ball Physics**:
  - 2.5D coordinates (`x, y, z`) with gravity, ground friction, and air drag.
  - Rotating pixel soccer ball showing patches and seams.
  - Realistic goalpost collisions with metallic "PING!" sound and sparks.
  - Soft dribbling when running into the ball; rocket power shots when holding kick.
  - Bank shots off the top wooden fence!
- **Procedural Pixel-Art Players**:
  - Customizable team jersey colors (Blue, Red, Yellow, Green, Purple, White, Black, Orange).
  - 4-frame animated running cycle, kicking extension frame, victory celebration poses, and drop shadows.
  - Overhead player marker badges (`P1`, `P2`, `CPU`) and kick charge meters.
- **100% Procedural Web Audio API Sound System**:
  - No external audio files or dependencies needed.
  - Pitch-drop kick sound + laser power shot whoosh.
  - Metallic goalpost hit ping.
  - Net swish noise filter.
  - Dual-tone frequency-modulated referee whistle (realistic pea whistle flutter).
  - Air horn + crowd cheering explosion on goals.
  - Retro 8-bit UI beeps and victory fanfare.
- **Match Customization**:
  - Match Duration: 1 min (Blitz), 2 min (Standard), 3 min, 5 min, or Practice (No Timer).
  - AI Difficulty: Easy, Medium, Hard.
  - Game Speed: Casual (0.9x), Normal (1.0x), Turbo Arcade (1.2x).
  - High score / win streak tracking saved automatically to `localStorage`.

---

## 📂 Project Structure

```
pixel-football-showdown/
├── index.html         # Main entry point & markup for UI, screens, HUD
├── style.css          # Arcade styles, pixel borders, responsive canvas layout
├── js/
│   ├── audio.js       # Procedural Web Audio API sound synthesizer
│   ├── physics.js     # Pitch geometry, goal bounds, 2.5D collision engine
│   ├── ball.js        # Football entity, height, rotation, trail, bounce
│   ├── player.js      # Player movement, sprint, stamina, pixel-art animation
│   ├── ai.js          # State-based football AI (Easy, Medium, Hard)
│   ├── controls.js    # Keyboard multi-key tracker & mobile touch controls
│   ├── renderer.js    # Canvas rendering: skyline, fence, pitch, nets, FX
│   ├── ui.js          # UI controller: menus, HUD, banners, settings, modals
│   ├── game.js        # Fixed-timestep engine loop, match rules & scoring
│   └── main.js        # Initialization, audio unlock, responsive resizing
└── README.md          # Documentation and deployment guide
```

---

## 🚀 Running Locally

Because this project is built entirely with standard web technologies (HTML5, CSS3, ES6 JavaScript, HTML5 Canvas, Web Audio API), no compilation, bundling, or backend server is required!

### Option 1: Direct File Open
Double-click `index.html` or open it directly in Google Chrome, Firefox, Safari, or Microsoft Edge.

### Option 2: Local HTTP Server (Recommended)
Using Python (if installed):
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

Using Node.js / npx:
```bash
npx serve .
```

---

## 🌐 Deployment Instructions

### Deploying to GitHub Pages
1. Initialize a git repository and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Pixel Football Showdown"
   ```
2. Create a new repository on GitHub (e.g. `pixel-football-showdown`).
3. Push to your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/pixel-football-showdown.git
   git branch -M main
   git push -u origin main
   ```
4. On GitHub, go to your repository **Settings** → **Pages**.
5. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
6. Select branch `main` and folder `/ (root)`, then click **Save**.
7. In a minute, your game will be live at `https://<your-username>.github.io/pixel-football-showdown/`!

### Deploying to Vercel
1. Install the Vercel CLI (or connect via github.com/vercel):
   ```bash
   npm i -g vercel
   ```
2. Run in the project directory:
   ```bash
   vercel
   ```
3. Follow the CLI prompts (accept default settings for a static HTML project).
4. Your game will instantly be deployed with a live URL and SSL certificate!
