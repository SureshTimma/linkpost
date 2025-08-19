# LinkPost: Your Friendly LinkedIn Auto-Posting Companion

---

## Features Overview

* **Phone OTP Authentication**
  Secure login via phone number and OTP.

* **OAuth Account Linking**
  Connect both LinkedIn and Google for seamless integrations.

* **Free Trial Post**
  One free automated LinkedIn post per user.

* **Premium Plan**
  ₹100 for a 3-month plan that unlocks unlimited posts and features.

* **Scheduling System**
  Flexible scheduling: choose your own days and times for posts.

* **Post Draft & Review Interface**
  Generate post drafts from trending news; preview and approve before publishing.

* **News-Based Suggestions**
  Recommend content ideas based on current events and trending topics.

* **Media Quality Control**
  Identify and flag low-quality images or media for improvement.

* **Render Cost Management**
  Premium users only; ensures cost-efficiency.

* **User Dashboard**
  View plan, post history, upcoming posts, and trigger automation.

* **Individual Scheduling**
  Unique schedules per user—no conflicts, no confusion.

* **Firebase + n8n Workflow Integration**
  Backend coordination using Firebase as the data store and n8n for workflow automation, enabling scalable scheduling, user data handling, and execution of LinkedIn post workflows.
  ([n8n][1], [Pipedream][2])

---

## Workflow Summary

1. User signs in via **Phone OTP**.
2. User links **LinkedIn** & **Google** accounts via OAuth.
3. Dashboard displays user plan (Free vs Premium).
4. User crafts a post with suggested trending content and reviews the draft.
5. User sets a specific **day and time** for posting.
6. Scheduled events trigger n8n workflows, with Firebase handling user data retrieval and job queuing.
7. Rendering and media quality checks occur (premium users only).
8. At the scheduled time, n8n executes the webhook to publish the post using OAuth tokens.
9. LinkedIn post is published, and the dashboard is updated with status and history.

---

## UI & Icon Design Guidance

### Color Palette for UI & Icons

| Role                | Color Name      | Hex Code  | Usage Purpose                |
| ------------------- | --------------- | --------- | ---------------------------- |
| **Primary**         | Futuristic Blue | `#1E40AF` | Headers, CTAs, icons         |
| **Accent**          | Soft Mint Green | `#B2F2BB` | Hover states, highlights     |
| **Background**      | Cool White      | `#F9FAFB` | Clean page background        |
| **Text / UI Lines** | Deep Charcoal   | `#1E1E1E` | Primary text and readability |

*Why it works:*

* Blue communicates trust and professionalism—ideal for a LinkedIn-connected tool.
  ([divami.com][3])
* Mint adds warmth and refreshment without clashing.
* Neutral tones ensure clarity and accessibility.

---

### Icon Design Guidelines

* **Style:** Minimal and architectural—single-tone icons. Default color: *Futuristic Blue*. Hover/active color: *Soft Mint Green*.
* **Format:** Use scalable SVG icons with `fill="currentColor"`, allowing flexible styling.
* **Recommended Library:** Heroicons or Feather Icons for clean, lightweight integration.
* **Organization:** Consolidate icons into a central `icons.tsx` or similar for maintainability and consistency.

---