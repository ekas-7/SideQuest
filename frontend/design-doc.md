Perfect — this is where your product actually becomes *cohesive*. I’ll give you a **high-leverage system prompt** you can reuse to generate *entire UI systems* (not just screens) that match your SideQuest aesthetic.

This is designed so every component feels like it belongs in the same world.

---

# 🔥 Component System Prompt (SideQuest Design System)

Create a cohesive, reusable **component design system** for a cinematic, gamified self-improvement platform (similar in spirit to a “real-life quest tracker”).

Use **React + Vite + Tailwind CSS + TypeScript + shadcn/ui**.

---

## 🧠 Core Design Philosophy

* **Cinematic + grounded** (not abstract, not overly futuristic)
* Feels like: *real life, but structured like a game*
* Emphasis on:

  * progress
  * consistency
  * proof
  * community

> The UI should feel like a calm, focused dashboard layered on top of an adventurous world.

---

## 🎨 Visual Language

### Colors

* Dark, slightly desaturated base (deep navy / charcoal)
* White + soft gray for text hierarchy
* Minimal accent color (used *only* for actions and highlights)
* Avoid bright gradients or flashy palettes

### Depth

* Use:

  * subtle shadows
  * soft borders
  * glassmorphism (sparingly, mostly nav + CTAs)
* Avoid:

  * heavy glow
  * neumorphism
  * visual noise

---

## ✍️ Typography System

* **Display**: elegant serif (hero headings only)
* **Body/UI**: Inter or similar sans-serif

Hierarchy:

* H1: cinematic, large, tight tracking
* H2/H3: clean, product-oriented
* Body: muted, readable
* Labels: small, slightly dimmed

---

## 🧱 Component Library (Build These)

### 1. Navigation Bar

* Glassmorphic floating container
* Pill-shaped
* Includes:

  * logo
  * nav links
  * primary CTA (“Start Quest”)
* Sticky with slight backdrop blur

---

### 2. Buttons

#### Primary Button

* Rounded-full
* Subtle glass / soft fill
* Slight hover scale (1.02–1.05)
* Used for: main actions (Start Quest)

#### Secondary Button

* Minimal outline or ghost
* Muted text
* Hover → brighter text

#### Icon Button

* Square or rounded
* Used in cards / actions

---

### 3. Cards (Core UI Unit)

#### Quest Card

* Contains:

  * title
  * short description
  * difficulty / category tag
  * CTA (Start / View)
* Slight elevation
* Rounded-xl
* Hover → lift + shadow

---

#### Proof Card

* Media preview (image/video)
* Username + timestamp
* Caption
* Light interaction icons (like, comment)

---

#### Streak Card

* Displays:

  * current streak 🔥
  * progress indicator
* Should feel *rewarding but not flashy*

---

### 4. Input Components

* Minimal, clean inputs
* Dark background with soft border
* Focus → subtle glow or border highlight
* Used for:

  * search (quests)
  * upload proof
  * filters

---

### 5. Tabs / Filters

* Used for:

  * categories (Fitness, Learning, Social, etc.)
* Style:

  * pill-shaped
  * active tab slightly brighter
  * smooth transitions

---

### 6. Modals / Sheets

* Used for:

  * uploading proof
  * quest details
* Centered or bottom sheet (mobile)
* Slight blur background overlay
* Rounded corners

---

### 7. Progress Indicators

* Linear progress bar (clean, thin)
* Circular streak indicator (optional)
* No flashy animations—keep it subtle

---

### 8. Feed Layout

* Vertical scroll
* Mix of:

  * proof cards
  * quest updates
* Balanced spacing
* Feels like:

  * Instagram × productivity app

---

## 🎞 Motion & Interaction

* Use **fade + rise animations**
* Duration: ~0.6–0.8s
* Ease: ease-out

Hover states:

* slight lift
* subtle brightness change

Avoid:

* bouncy animations
* excessive motion

---

## 📱 Responsiveness

* Mobile-first
* Navbar collapses into menu
* Cards stack cleanly
* Maintain spacing rhythm

---

## 🧩 Layout System

* Max width: `max-w-6xl` or `max-w-7xl`
* Generous vertical spacing
* Clear section separation

---

## 🚫 Hard Constraints

* No bright gradients
* No cluttered UI
* No excessive borders
* No overly “Web3” or neon aesthetic

---

## 🎯 Output Requirement

Generate:

* Reusable React components
* Clean Tailwind classes
* Proper spacing and hierarchy
* Consistent styling across all components

---

## 🧠 Final Mental Model

> This is not a productivity app.
> This is a **life game interface**.

---

If you want, next step I can:

* turn this into an actual **file structure + component code (Navbar, Card, Button, etc.)**
* or design a full **Home / Quest / Feed page using this system**
