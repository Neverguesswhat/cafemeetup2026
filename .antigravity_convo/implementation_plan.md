# Implementation Plan: Predictive Search & Calendar Picker

This plan details the implementation of a predictive search dropdown for coffee shop locations and a calendar picker for date-time selection on the meetup proposal and negotiation pages.

## User Review Required

> [!IMPORTANT]
> **Predictive Location Search**: We will replace the static `<select>` dropdown in `/meetup-propose` with a custom predictive search input. As the user types, a dropdown panel will display matched venues from a curated list of local venues (e.g. Cuppa & Co, Retro Cafe, etc.) filtering dynamically. Clicking a suggestion selects it. The user can also type a custom location.
>
> **Calendar Date & Time Picker**: We will replace the text inputs in `/meetup-propose` and `/negotiate` with a native HTML5 `<input type="datetime-local">` calendar picker. On mobile browsers (iOS WebKit), this triggers the premium native spinning date-time wheels.
>
> **Immersive Formatting**: When proposal options are saved to the global state, the raw datetime string (e.g. `2026-06-08T19:00`) will be formatted into a clean, human-readable string (e.g. `"Today at 7:00 PM"` or `"Tue, Jun 9 at 6:30 PM"`). This ensures the rest of the application screens (Date View, Charlotte's Review, Messages) display nicely without requiring any changes.

## Proposed Changes

### Components & Pages

#### [MODIFY] [meetup-propose/page.tsx](file:///Users/neverguesswhat/Documents/Work/Projects/CafeMeetup2026/app/meetup-propose/page.tsx)
- Create a list of expanded suggestions (`SUGGESTED_VENUES`).
- For each option card:
  - **Predictive Search**: Implement a search state. Render a text input inside a container. On focus or query typing, render a floating, borderless, glassmorphic dropdown displaying filtered suggestions. On click, update option location and collapse list.
  - **Calendar Picker**: Render a datetime picker (`type="datetime-local"`). Store raw values locally, and parse defaults (e.g., Today at 7 PM -> `YYYY-MM-DDTHH:MM` equivalent).
- Add helper method `formatDateTime` to convert raw picker values to clean strings on submit.

#### [MODIFY] [negotiate/page.tsx](file:///Users/neverguesswhat/Documents/Work/Projects/CafeMeetup2026/app/negotiate/page.tsx)
- Convert the suggested new time input field from a text input to a calendar picker (`type="datetime-local"`).
- Convert raw picker values to clean strings on submit using the `formatDateTime` helper.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure successful compilation.

### Manual Verification
1. Open the proposal screen (`/meetup-propose`) as James.
2. Verify that typing in the "Coffee Shop Location" filters suggestions dynamically and selecting one fills the input.
3. Verify that clicking the Date & Time picker brings up a calendar sheet (or native picker on iOS).
4. Select a date-time and submit proposals.
5. In James's wait view, verify the outgoing proposals are formatted nicely (e.g. `"Today at 7:00 PM"`).
6. Switch to Charlotte/Laura perspective, verify proposal options render with clean text.
7. Click "Edit Time" to go to the negotiation screen.
8. Verify that the suggested time uses a calendar picker, and submitting it counter-proposes a clean string to James.
