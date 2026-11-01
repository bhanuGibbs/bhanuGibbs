---
name: KeelBill Ledger
description: Professional billing workspace for small and medium-sized businesses
colors:
  emerald-accent: "#047857"
  emerald-light: "#d1fae5"
  emerald-lighter: "#ecfdf5"
  emerald-dark: "#065f46"
  slate-950: "#0f172a"
  slate-900: "#1e293b"
  slate-800: "#334155"
  slate-700: "#3b496b"
  slate-600: "#475569"
  slate-500: "#64748b"
  slate-400: "#94a3b8"
  slate-300: "#cbd5e1"
  slate-200: "#e2e8f0"
  slate-100: "#f1f5f9"
  slate-50: "#f8fafc"
  brand-blue: "#2563eb"
  brand-blue-light: "#dbeafe"
  brand-blue-lighter: "#eff6ff"
  rose-error: "#f43f5e"
  rose-error-light: "#ffe4e6"
  rose-error-lighter: "#fff1f2"
  amber-warning: "#f59e0b"
  amber-warning-light: "#fef3c7"
  page-bg: "#f7f8fa"
  white: "#ffffff"
typography:
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  lg: "8px"
  xl: "12px"
  "2xl": "16px"
  "3xl": "24px"
  section: "28px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "#047857"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "8px 14px"
  button-dark:
    backgroundColor: "#0f172a"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  input-default:
    backgroundColor: "#ffffff"
    textColor: "#3b496b"
    rounded: "{rounded.2xl}"
    padding: "12px 16px"
  card-section:
    backgroundColor: "#ffffff"
    rounded: "{rounded.section}"
    padding: "{spacing.lg}"
---

# Design System: KeelBill Ledger

## Overview

**Creative North Star: "The Modern Workspace"**

KeelBill Ledger is a clean, efficient, and professional billing workspace that feels modern without being trendy. Every screen is organized, trustworthy, and effortless to use. The design combines a refined slate-grey and white foundation with subtle emerald accents, generous spacing, clear typography, and minimal borders. The experience makes everyday billing, invoicing, and business management feel simple and confident.

The visual language follows a **precision over decoration** philosophy: every element serves a clear business purpose. Professionalism, clarity, and trust are communicated through consistent layouts, clean typography, balanced spacing, and subtle colors rather than unnecessary decoration. The interface is minimal, intuitive, and efficient for everyday business operations.

**Key Characteristics:**
- Slate-grey and white foundation with emerald green as the meaningful accent
- Generously rounded corners (16–28px) creating a soft, approachable feel
- Card-based layout with subtle borders and light shadows
- Clean Inter typeface with tight tracking on headings
- Status-driven color coding: emerald for success, amber for warnings, rose for errors
- Responsive design that adapts from desktop to mobile with table-to-card transformations

## Colors

A neutral slate palette carries the structure; emerald green signals growth, trust, and financial confidence as a restrained accent.

### Primary
- **Emerald Accent** (#047857): Primary action buttons, active navigation states, accent links, payment confirmations, and positive financial indicators. Communicates growth and trust. Used sparingly — on no more than 10–15% of any given screen.
- **Emerald Light** (#d1fae5): Background for emerald-tinted icon badges, status chips, and hover states on interactive elements.
- **Emerald Lighter** (#ecfdf5): Subtle background wash for hover states on quick action cards and interactive list items.
- **Emerald Dark** (#065f46): Hover state for primary emerald buttons.

### Secondary
- **Brand Blue** (#2563eb): Focus ring borders on inputs, focus states, and interactive link hover. Provides a distinct visual signal for keyboard navigation and form interaction.
- **Brand Blue Light** (#dbeafe): Focus ring glow around inputs (`ring-brand-100`).

### Neutral
- **Slate 950** (#0f172a): Page text color, primary dark buttons, header logo background, and dark CTA cards. The darkest anchor of the system.
- **Slate 900** (#1e293b): Active navigation background, heading text.
- **Slate 800** (#334155): Table cell text, strong body text.
- **Slate 700** (#3b496b): Input text, label text, body text.
- **Slate 600** (#475569): Secondary body text, table headers.
- **Slate 500** (#64748b): Muted text, descriptions, placeholder hints, inactive navigation.
- **Slate 400** (#94a3b8): Icon color in neutral contexts, placeholder text.
- **Slate 300** (#cbd5e1): Subtle dividers.
- **Slate 200** (#e2e8f0): Borders on cards, inputs, and dividers.
- **Slate 100** (#f1f5f9): Icon badge backgrounds, table header background, status chip backgrounds.
- **Slate 50** (#f8fafc): Input backgrounds, table row backgrounds, toggle group backgrounds.
- **Page Background** (#f7f8fa): Main page background color — a cool, neutral grey that provides contrast against white cards.
- **White** (#ffffff): Card backgrounds, header background, input default background.

### Functional
- **Rose Error** (#f43f5e): Validation error text, destructive action icons.
- **Rose Error Light** (#ffe4e6): Error alert backgrounds, destructive button backgrounds.
- **Rose Error Lighter** (#fff1f2): Subtle error hover states.
- **Amber Warning** (#f59e0b): Warning status indicators.
- **Amber Warning Light** (#fef3c7): Warning alert backgrounds, unpaid invoice status chips.

### Named Rules

**The Emerald Restraint Rule.** Emerald green is the voice of financial confidence. It appears on primary actions, success states, and positive indicators — never as decoration. Its rarity is what gives it weight.

**The Neutral Foundation Rule.** Slate grey and white carry 90% of the interface. Color is reserved for meaning: status, action, or error.

## Typography

**Display Font:** Inter (with system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif fallback)
**Body Font:** Inter (same stack)
**Label/Mono Font:** None distinct — Inter serves all roles

**Character:** Inter provides a clean, neutral voice that prioritizes readability at small sizes. Tight tracking on headings creates a refined, modern feel, while regular body text remains highly legible for data-heavy tables and forms.

### Hierarchy
- **Page Title** (600, 34–36px, 1.2, tracking -0.015em): Dashboard greeting, page headings. Appears once per page at the top.
- **Section Title** (600, 18px, 1.2): Section headers within form sections and cards.
- **Card Heading** (600, 14px, 1.25): Card and table section titles.
- **Body** (400, 14px, 1.5): Default text for descriptions, table cells, and form help text. Max line length ~65ch for readability.
- **Small Body** (400, 12px, 1.5): Muted descriptions, helper text, timestamps.
- **Label** (500, 14px, 1.5): Form labels, input placeholder text.
- **Micro Label** (600, 11px, uppercase, tracking 0.15em): Eyebrow text, table column headers, status chip text.

### Named Rules

**The Tight Heading Rule.** All headings use `tracking-tight` (letter-spacing -0.015em) for a refined, modern appearance. Body text uses default tracking for maximum readability.

**The Size Discipline Rule.** Only page-level headings exceed 24px. Section and card headings stay at 14–18px to maintain visual hierarchy without shouting.

## Layout

The workspace uses a centered, max-width container (`max-w-[1440px]`) with responsive padding (`px-4 sm:px-6 lg:px-8`). The page background is `#f7f8fa`, creating a subtle contrast against white card sections.

**Grid System:**
- Dashboard stats: 4-column grid on XL screens, 2-column on SM, single column on mobile
- Document lists: Full-width card with internal table layout
- Forms: 2-column grid on medium screens, single column on mobile
- Dashboard split view: Two-column layout (`[minmax(0,1fr)_335px]`) on XL screens

**Spacing Rhythm:**
- Section gaps: 16–24px between major sections
- Card internal padding: 20px on mobile, 28px on desktop (`p-5 sm:p-7`)
- Form field gaps: 20px (`gap-5`)
- Page vertical padding: 32px on mobile, 40px on desktop (`py-8 lg:py-10`)

**Responsive Behavior:**
- Navigation collapses to hamburger menu below XL breakpoint (1280px)
- Item table transforms from table to card grid on tablets (`max-width: 1279px`)
- Input font size increases to 16px on mobile to prevent iOS zoom
- Stats grid reduces from 4 to 2 to 1 column
- Two-column forms stack to single column

## Elevation & Depth

The system uses a hybrid approach: tonal layering as the primary depth mechanism, with subtle shadows for card elevation.

### Shadow Vocabulary
- **Soft Shadow** (`0 10px 30px rgba(37, 99, 235, 0.12)`): Applied to main form sections and card containers. A diffuse, warm shadow that lifts content from the page background.
- **Small Shadow** (`shadow-sm`): Applied to list cards, stat cards, and table containers. Minimal elevation for structural separation.
- **Large Shadow** (`shadow-xl`): Dropdown menus, popovers, and account menu. Strong separation from underlying content.

### Named Rules

**The Flat-By-Default Rule.** Most surfaces rely on borders (`border-slate-200`) and background contrast against `#f7f8fa` for separation. Shadows appear only on elevated cards and dropdowns.

**The Border Opacity Rule.** Card borders use `border-slate-200/80` (80% opacity) for a softer, more refined edge than solid borders.

## Shapes

The form language is defined by generously rounded corners, creating a soft, approachable feel that contrasts with the precision of the data it presents.

**Corner Scale:**
- **8px** (`rounded-lg`): Small interactive elements like dropdown items, small buttons within tables
- **12px** (`rounded-xl`): Navigation items, buttons, input elements within tables, icon badges
- **16px** (`rounded-2xl`): Primary input fields, cards, stat cards, table rows, quick action cards
- **24px** (`rounded-3xl`): Inner containers within sections (summary breakdown panels)
- **28px** (`rounded-[28px]`): Main form sections — the largest, most prominent containers
- **Full** (`rounded-full`): Status chips, user avatar circles

**Borders:**
- Card borders: `1px solid #e2e8f0/80` (slate-200 at 80% opacity)
- Input borders: `1px solid #e2e8f0` (slate-200)
- Divider lines: `1px solid #f1f5f9` (slate-100) for subtle separation
- Dashed borders: Used for upload zones (`border-dashed border-slate-300`)

## Components

### Buttons
- **Shape:** 12px radius (`rounded-xl`)
- **Primary (Emerald):** Background `#047857`, white text, 14px font, semibold weight. Padding `8px 14px`. Hover: `#065f46`. Used for main actions like "Download Invoice."
- **Dark (Slate):** Background `#0f172a`, white text, semibold weight. Padding `12px 16px`. Hover: `#064e3b` (emerald-800). Used for "Create document" CTAs and login submit.
- **Ghost:** No background, slate-500 text. Hover: slate-50 background. Used for icon-only buttons like reset.
- **Destructive:** Rose-50 background, rose-600 icon, rose-200 border. Hover: rose-100 background. Used for delete item actions.
- **Text Link:** Emerald-700 text, semibold, no background. Used for inline actions like "Mark paid."

### Inputs / Fields
- **Shape:** 16px radius (`rounded-2xl`)
- **Style:** White background, `1px solid #e2e8f0` border, `shadow-sm`. Padding `12px 16px`. Text size 14px, color `#3b496b`.
- **Focus:** Border changes to `#2563eb` (brand-500) with a 2px ring in `#dbeafe` (brand-100). Background transitions to white.
- **Error:** Rose-500 text below the input for validation messages.
- **Disabled:** 60% opacity, cursor not allowed.
- **With Icon:** Icon positioned absolutely at `left-3 top-3`, input padding-left increased to `pl-10`.

### Cards / Containers
- **Section Cards:** 28px radius, white background, `border-slate-200/80`, `shadow-soft`. Internal padding 20px mobile / 28px desktop.
- **Stat Cards:** 16px radius, white background, `border-slate-200/80`, `shadow-sm`. Internal padding 20px.
- **List Card:** 16px radius, white background, `border-slate-200/80`, `shadow-sm`. Contains tables with `slate-50/80` header and `slate-100` row dividers.
- **Dark CTA Card:** 16px radius, `#0f172a` background, white text. Used for sidebar CTAs and promotional sections.

### Navigation
- **Header:** Sticky top, 72px height, white background with 95% opacity and `backdrop-blur-xl`. Bottom border `slate-200`.
- **Nav Links:** 13px font, medium weight, 12px radius. Inactive: slate-500 text with slate-100 hover. Active: slate-900 background with white text.
- **Mobile Menu:** 2-column grid, appears below header with top border.
- **Toggle Group:** 12px radius container, slate-50 background, slate-200 border. Active item: white background with `shadow-sm`.

### Status Chips
- **Shape:** Full radius (`rounded-full`)
- **Style:** Small pill badges with tinted background and darker text. Padding `4px 10px`. Font size 11px, semibold.
- **Draft:** Slate-100 background, slate-700 text
- **Paid:** Emerald-50 background, emerald-700 text
- **Unpaid:** Amber-50 background, amber-700 text

### Dropdowns
- **Shape:** 12px radius
- **Style:** White background, `border-slate-200`, `shadow-xl`. Internal padding 4px.
- **Items:** 12px radius, slate-800 text. Hover: slate-50 background.
- **Account Menu:** 20px radius, 240px width, with border and shadow. Contains user info section separated by border.

### Tables
- **Header:** Slate-50/80 background, 11px uppercase text, semibold, tracking 0.15em, slate-500 color.
- **Rows:** Divided by slate-100 lines. Hover: slate-50/70 background.
- **Item Table (form):** Uses `border-separate` with vertical gaps. Each row is a rounded card (16px) with slate-50/70 background. Transforms to grid layout on tablets.

### Empty States
- Centered content with icon in slate-100 badge (48px), heading in 14px semibold, description in 12px muted text.
- Action link in emerald-700 with arrow icon.

## Do's and Don'ts

### Do:
- **Do** use emerald green for primary actions and positive financial states — let its restraint give it meaning.
- **Do** maintain 16–28px corner radius on cards and inputs for the soft, approachable character.
- **Do** use `tracking-tight` on all headings for a refined, modern appearance.
- **Do** prefer borders and background contrast over shadows for card separation.
- **Do** keep form labels at 14px medium weight with 2px bottom margin for clear association.
- **Do** use status chips (rounded-full) with tinted backgrounds for visual state communication.
- **Do** ensure inputs are 16px font size on mobile to prevent iOS zoom.

### Don't:
- **Don't** use emerald green as a background or decorative color — reserve it for action and meaning.
- **Don't** add gradients, excessive shadows, or decorative elements that don't serve a business purpose.
- **Don't** use sharp corners (0–4px radius) on primary UI elements — the system's character is softly rounded.
- **Don't** exceed 34px font size except for the auth page hero — the system speaks in measured voices.
- **Don't** use more than one accent color family per screen — emerald leads; brand blue appears only for focus states.
- **Don't** remove or alter GST-related terminology, calculations, or Indian market conventions.
- **Don't** change the PDF document formats, numbering systems, or company branding elements during UI improvements.
