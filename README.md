# RoboSim 3D — DobotStudio V1.9.4 Robotic Arm Simulation Suite

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r171-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Simulation-Virtual%20Only-orange.svg)]()

A high-fidelity desktop robot simulation environment inspired by the layout, visual aesthetics, controls, and workflows of **DobotStudio V1.9.4**. Built with **React 18**, **TypeScript**, **Three.js**, **React Three Fiber (@react-three/fiber)**, **Drei (@react-three/drei)**, and custom industrial CSS.

> ⚠️ **Educational Simulation Disclaimer:** This is a purely virtual desktop simulation suite. It does not connect to, send commands to, or require a physical robot.

---

## 📸 Overview & Visual Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  RoboSim 3D - DobotStudio V1.9.4   [COM3 Connected]  [Dobot Magician]  [Cam Home] [Robot Home] [E-STOP] │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [New] [Open] [Save]  ▶ Start  ❚❚ Pause  ■ Stop   Loop: [1]   Speed: [50%]   Accel: [50%]        │
├──────────────────────────────────────────────────────────────────────┬───────────────────────────┤
│                                                                      │  CARTESIAN COORDINATES    │
│                                                                      │  X: 200.00 mm   Y: 0.00 mm│
│                                                                      │  Z: 50.00 mm    R: 0.00°  │
│                                                                      ├───────────────────────────┤
│                     CENTRAL 3D VIEWPORT                              │      [Y+]                 │
│         - 4-DOF Articulated Dobot Arm Simulation                     │  [X-] (D-PAD) [X+]        │
│         - Suction Cup / 2-Finger Servo Gripper                       │      [Y-]    [Z+] [R+]    │
│         - Interactive Orbit, Pan & Zoom                              │              [Z-] [R-]    │
│         - ISO / TOP / FRONT / SIDE Camera Presets                    ├───────────────────────────┤
│         - Reach Envelope & Engineering Grid                          │  JOINT ANGLES (J1 - J4)   │
│                                                                      │  J1: 0.0°   J2: 40.0°     │
│                                                                      │  J3: 20.0°  J4: 0.0°      │
├──────────────────────────────────────────────────────────────────────┴───────────────────────────┤
│  TEACHING & PLAYBACK POINT TABLE                                                                 │
│  #  | Type | Point Name       | X (mm)  | Y (mm)  | Z (mm)  | R (deg) | Pause   | Tool Action   │
│  1  | MOVJ | Standby Home     | 200.00  | 0.00    | 50.00   | 0.00    | 500 ms  | none          │
│  2  | MOVJ | Pick Approach    | 220.00  | 60.00   | -10.00  | 15.00   | 800 ms  | suction_on    │
│  3  | JUMP | Place Target     | 180.00  | -80.00  | -10.00  | -20.00  | 800 ms  | suction_off   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ● COM3 (Dobot Virtual) | Robot: Dobot Magician | Mode: Synchronized FK/IK | Status: Ready       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. DobotStudio V1.9.4 Industrial HMI
- **Desktop Workstation Aesthetic**: Dark charcoal theme (`#18191c`, `#222428`, `#2b2d33`) with subtle bevels, thin steel borders, and high functional information density.
- **Live Digital Readouts**: Cyan/blue segmented readouts for Cartesian coordinates ($X, Y, Z, R$) and joint angles ($J_1, J_2, J_3, J_4$).
- **Latching Emergency Stop (E-STOP)**: Prominent red E-STOP button that halts motion, clears command queues, applies visual alarm styling, and locks all controls until deliberately reset.
- **Virtual Port Configuration**: Configurable virtual serial connection (`COM3`, `COM4`, `COM5`) and standard industrial baud rates (9600 to 115200 bps).

### 2. High-Detail Articulated 3D Dobot Arm
- Separate procedural mechanical components organized in a proper kinematic hierarchy:
  - **Fixed Base Plate**: Chamfered industrial base with mounting holes.
  - **Rotating Turntable**: Stepper motor housing with heatsink cooling fins.
  - **Twin Upper Arm Beams**: Lightweight dual aluminum alloy linkage with CNC pockets.
  - **Parallel Mechanical Rod**: Keeps the tool center plane stabilized across pitch changes.
  - **Forearm Knuckle & Wrist Assembly**: 4th DOF wrist rotation mechanism.
  - **Interchangeable End-Effectors**:
    - **Pneumatic Suction Cup**: Silicon suction cup with vacuum activation glow.
    - **2-Finger Servo Gripper**: Articulated parallel fingers with animated opening and closing.
- **Lighting & Scene**: Soft directional key lights, ambient fill, contact shadows, engineering measurement grid, and togglable cylindrical reach envelope.

### 3. Synchronized Dual-Mode Kinematics
- **Forward Kinematics (FK)**:
  - Real-time computation of end-effector pose from joint angles $(J_1, J_2, J_3, J_4)$.
- **Inverse Kinematics (IK)**:
  - Closed-form analytical solver translating target coordinates $(X, Y, Z, R)$ to valid joint angles.
  - Automatic reach verification; impossible Cartesian positions outside the workspace ($R < 140\text{ mm}$ or $R > 325\text{ mm}$) are safely rejected with instant user feedback.
- **Synchronized State**: Manipulating joints updates Cartesian coordinates, and jogging Cartesian axes updates joint readouts and 3D geometry simultaneously.

### 4. Comprehensive Teaching & Playback
- **Point Table**: Point number, editable name, motion type, $X, Y, Z, R$ values, dwell/pause duration (ms), and tool action.
- **Supported Motion Types**:
  - `MOVJ`: Joint-space trajectory interpolation.
  - `MOVL`: Cartesian straight-line linear interpolation with continuous IK evaluation.
  - `JUMP`: Parabolic arch motion for obstacle clearance (vertical lift $\rightarrow$ horizontal translation $\rightarrow$ vertical descend).
- **Playback Execution**: Start, Pause, Resume, Stop, Loop count selector (1 to Infinite), and active execution row highlighting.
- **Persistence**: Real-time browser `localStorage` autosave, JSON program export (`.dobot.json`), and program file import with strict schema validation.
- Preloaded with a working **Dobot Pick & Place Demo** program.

### 5. Camera & Navigation Presets
- Independent **Camera Home** (resets perspective without moving the robot) and **Robot Home** (smoothly moves arm back to standby pose).
- View presets: **ISO**, **TOP**, **FRONT**, and **SIDE**.
- Orbit, zoom, and pan controls with boundary limits.

---

## 📐 Kinematic Model & Specifications

### Arm Geometry Dimensions
Modeled after the Dobot Magician:

| Parameter | Symbol | Value | Description |
| :--- | :---: | :---: | :--- |
| **Base Elevation** | $H_{\text{base}}$ | $105.0\text{ mm}$ | Height from ground to shoulder pivot |
| **Upper Arm Length** | $L_1$ | $175.0\text{ mm}$ | Shoulder pivot to elbow pivot |
| **Forearm Length** | $L_2$ | $142.0\text{ mm}$ | Elbow pivot to wrist center |
| **End-Effector Offset** | $L_{\text{tool}}$ | $95.0\text{ mm}$ | Wrist center to Tool Center Point (TCP) |
| **Reach Envelope** | $R_{\min} - R_{\max}$ | $140\text{ mm} - 325\text{ mm}$ | Planar cylindrical reach boundaries |
| **Z Working Range** | $Z_{\min} - Z_{\max}$ | $-80\text{ mm} - +160\text{ mm}$ | Vertical elevation stroke |

### Joint Range Limits

| Joint | Motion Description | Range Limits | Standby Home Pose |
| :---: | :--- | :---: | :---: |
| **$J_1$** | Base Rotation (Turntable) | $-90.0^\circ \le J_1 \le +90.0^\circ$ | $0.0^\circ$ |
| **$J_2$** | Shoulder Pitch | $0.0^\circ \le J_2 \le +85.0^\circ$ | $+40.0^\circ$ |
| **$J_3$** | Elbow Pitch | $-10.0^\circ \le J_3 \le +90.0^\circ$ | $+20.0^\circ$ |
| **$J_4$** | Wrist / Tool Rotation | $-90.0^\circ \le J_4 \le +90.0^\circ$ | $0.0^\circ$ |

### Mathematical Kinematics Formulas
- **Planar arm radius**:
  $$\text{proj}_r = L_1 \cos(J_2) + L_2 \cos(J_2 + J_3) + L_{\text{tool}}$$
- **Cartesian Coordinates**:
  $$X = \text{proj}_r \cos(J_1)$$
  $$Y = \text{proj}_r \sin(J_1)$$
  $$Z = H_{\text{base}} + L_1 \sin(J_2) + L_2 \sin(J_2 + J_3)$$
  $$R = J_1 + J_4$$

---

## 🛠️ Project Structure

```
robosim-3d/
├── .gitignore                       # Production-grade gitignore
├── README.md                        # Documentation & setup guide
├── index.html                       # Application HTML entry point
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # Root TypeScript configuration
├── tsconfig.app.json                # Application TypeScript rules
├── vite.config.ts                   # Vite build configuration
└── src/
    ├── main.tsx                     # React application root
    ├── App.tsx                      # Primary DobotStudio layout coordinator
    ├── index.css                    # DobotStudio dark charcoal design system
    ├── types/
    │   ├── robot.ts                 # RobotPose, CartesianCoords, JointAnglesDeg, EndEffectorType
    │   └── program.ts               # TeachingPoint, ProgramData, PlaybackState
    ├── config/
    │   └── robotConfig.ts           # Mechanical constants, limits, increments, ports
    ├── robotics/
    │   └── kinematics.ts            # Analytical FK, IK, joint limit guards, trajectory planners
    ├── hooks/
    │   ├── useRobotState.ts         # Authoritative robot state, FK/IK sync, jog, E-stop
    │   └── useProgramPlayback.ts    # Teaching sequence executor, loop engine, pause/resume
    ├── utils/
    │   ├── programStorage.ts        # LocalStorage, file import/export, default demo
    │   └── programValidation.ts     # JSON schema validator
    └── components/
        ├── layout/
        │   ├── AppHeader.tsx        # Top header with port, E-stop, Cam Home, Robot Home
        │   ├── MainToolbar.tsx      # Teaching & playback controls, speed/accel sliders
        │   └── StatusBar.tsx        # Bottom status bar, connection LED, coordinate ticker
        ├── viewport/
        │   ├── SimulationViewport.tsx # Viewport, OrbitControls, reach envelope, camera presets
        │   └── RobotArm3D.tsx       # 3D Dobot mesh hierarchy & PBR materials
        ├── controls/
        │   └── RightOperationPanel.tsx # Cyan digital readouts, circular D-pad, Joint jog
        └── teaching/
            └── TeachingPanel.tsx    # Teaching point table, inline rename, reorder, delete
```

---

## 💻 Installation & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.18+ or 20 LTS recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [Git](https://git-scm.com/)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/robosim-3d.git
cd robosim-3d
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open your browser and navigate to the printed local URL (typically `http://localhost:5173` or `http://localhost:5174`).

### 4. Create production build
```bash
npm run build
npm run preview
```

---

## 🚀 How to Push to GitHub

If you have initialized this project locally and want to push it to a new GitHub repository:

### Step 1: Initialize Git (if not already done)
```bash
git init
```

### Step 2: Stage and Commit All Files
```bash
git add .
git commit -m "feat: initial commit of DobotStudio V1.9.4 robotic arm simulation suite"
```

### Step 3: Set Default Branch to `main`
```bash
git branch -M main
```

### Step 4: Link to Your GitHub Remote Repository
Create an empty repository on [GitHub](https://github.com/new) (e.g. named `robosim-3d`), then run:
```bash
git remote add origin https://github.com/<your-username>/robosim-3d.git
```

### Step 5: Push to GitHub
```bash
git push -u origin main
```

---

## 🎮 User Guide & Controls Reference

### Cartesian Jogging
- **Planar XY (D-Pad)**: Click **X+**, **X-**, **Y+**, **Y-** to move the tool in the horizontal plane.
- **Vertical Z**: Click **Z+** or **Z-** to raise or lower the arm.
- **Wrist R**: Click **R+** or **R-** to rotate the end-effector.
- **Step Size**: Toggle between **1 mm**, **5 mm**, **10 mm**, or **20 mm** step increments.

### Joint Jogging
- Switch to the **Joint** tab in the Right Operation Panel.
- Use **+** and **-** buttons next to **J1**, **J2**, **J3**, and **J4** to articulate each joint individually.
- Angular step size can be set to **1°**, **5°**, **10°**, or **15°**.

### Teaching & Playback
1. Jog the robot to any desired target pose.
2. Click **Save Current Position** in the Right Operation Panel or Toolbar.
3. Edit the point name, motion type (`MOVJ`, `MOVL`, `JUMP`), dwell time, or gripper action.
4. Set the **Loop Count** on the toolbar.
5. Click **Start** (▶) to execute the sequence.
6. Click **Save Program** to download the program as a `.dobot.json` file, or click **Open Program** to load previously saved sequences.

### Emergency Stop
- Click the prominent red **EMERGENCY STOP** button in the header at any time.
- All active motion and playback halts immediately.
- Jog controls and toolbar buttons are locked out.
- Click **RESET E-STOP** to clear the safety state and resume operation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and distribute for educational, research, and development purposes.
