# Student UI Audit Checklist

## Scope
- Keep the current student navbar unchanged.
- Use the existing student dashboard and student project pages as the visual reference.
- Migrate the rest of the frontend page by page using the same Aura Academic Accent palette.

## Reference Pages To Match
- StudentProjectDashboard
- StudentMyProjects
- StudentProjectOverview
- StudentGlobalAssignments

## Phase 1: Inventory

### Page Inventory
- [ ] Student dashboard pages
- [ ] Project list and project detail pages
- [ ] Assignment pages
- [ ] Notification and announcement pages
- [ ] Calendar and profile pages
- [ ] Lecturer and manager pages that students can still reach indirectly

### Component Inventory
- [ ] Reusable primitives: buttons, inputs, selects, textareas, badges, alerts, cards, modals, tables, toasts
- [ ] Layout components: student nav, student layout, dashboard shell, page headers
- [ ] Page-specific widgets: stats cards, progress panels, task feeds, file upload blocks, submission panels
- [ ] Legacy one-off components: any hardcoded styling that does not follow shared tokens

### Issue Tags
Use these tags during review:
- [ ] Theme mismatch
- [ ] Layout mismatch
- [ ] UX weak
- [ ] Responsive issue
- [ ] Accessibility issue
- [ ] State handling issue

## Phase 2: Design Rules To Enforce

### Design System Tokens
- [ ] Background: #F8FAFC
- [ ] Surface: #FFFFFF
- [ ] Primary accent: #818CF8
- [ ] Secondary accent: #0D9488
- [ ] Headings: deep slate
- [ ] Body text: slate
- [ ] Radius: consistent rounded-xl / rounded-2xl / rounded-[2rem] tiers
- [ ] Shadows: soft layered shadows only, no heavy dark blocks
- [ ] Motion: subtle entry, hover lift, modal fade, skeleton shimmer

### Layout Rules
- [ ] Page containers use consistent max widths
- [ ] Sections have consistent vertical spacing
- [ ] Cards keep the same padding rhythm
- [ ] Mobile stacks before tablet/desktop split layouts
- [ ] Tables and filter bars do not overflow on small screens

### Component Rules
- [ ] Buttons have consistent primary, secondary, and destructive variants
- [ ] Inputs show focused, invalid, disabled, and helper states
- [ ] Modals use consistent header, body, and action spacing
- [ ] Tables use consistent row density and action placement
- [ ] Empty states include a clear message and next step CTA

## Phase 3: Priority Migration Backlog

### Tier 1: Student Flow First
- [ ] StudentProjectDashboard
  - Current issues: verify hero polish, sidebar rhythm, and card consistency
  - New design decisions: keep as the reference shell for the student area
  - Dev checklist: audit spacing, icons, hover states, and shell width
  - QA checklist: check tablet collapse, sticky sidebar, and active tab states

- [ ] StudentMyProjects
  - Current issues: confirm card density, filter UX, and accent consistency
  - New design decisions: keep the project-card visual language aligned with the dashboard
  - Dev checklist: standardize cards, filters, empty state, and loading state
  - QA checklist: search/filter behavior, mobile card stacking, and status badges

- [ ] StudentGlobalAssignments
  - Current issues: validate submission cards, filter bar, and empty/loading states
  - New design decisions: maintain same hero + stats + cards pattern
  - Dev checklist: keep token colors and spacing consistent
  - QA checklist: submission flow, responsive filters, and feedback states

### Tier 2: Supporting Student Pages
- [ ] StudentProjectOverview
  - Current issues: mixed legacy accents, dense widget layout
  - New design decisions: align with dashboard card language and background depth
  - Dev checklist: replace old color cues, unify typography, and smooth hierarchy
  - QA checklist: widget stacking, overflow, and readability

- [ ] StudentCalendar
  - Current issues: dense calendar controls and inconsistent spacing
  - New design decisions: use the same control panel and card style as other student pages
  - Dev checklist: refactor filters, headers, and event cards
  - QA checklist: mobile navigation, event density, and focus states

- [ ] StudentProfile
  - Current issues: form polish, sections, and state messaging
  - New design decisions: make it feel like part of the same product family
  - Dev checklist: standardize form fields, profile cards, and action buttons
  - QA checklist: validation, mobile layout, and edit/save flows

### Tier 3: Forms, Popups, and Shared Components
- [ ] ProjectCreateForm
- [ ] ProjectSettings
- [ ] TeamManagement
- [ ] AnnouncementBoard
- [ ] NotificationCenter
- [ ] Modals, confirm dialogs, and success toasts

## Phase 4: Review Gate
- [ ] Visual diff check against the dashboard reference pages
- [ ] Check color contrast and button states
- [ ] Test keyboard navigation and modal focus
- [ ] Test mobile widths and long-text overflow
- [ ] Run a smoke test on the main student routes

## Suggested Order
1. StudentProjectDashboard reference pass
2. StudentMyProjects
3. StudentGlobalAssignments
4. StudentProjectOverview
5. StudentCalendar and StudentProfile
6. Forms, popups, and shared components
7. Remaining role pages and edge states

## Status Board
- Not Started
- In Progress
- Review
- Done
