# SMU Peer Evaluation System — Claude Code Dev Doc

## Purpose
Build a production-ready web application for the **Singapore Management University (SMU) Peer Evaluation System** using **Next.js** with a backend connected to **Google Cloud SQL**, **Google Analytics**, and future **Pabbly webhook** integration.

This document is written as implementation instructions for **Claude Code** so it can scaffold and build the app in a structured, production-minded way.

---

## 1. Product Summary

The application supports three main user roles:
- **Student**
- **Professor**
- **Administrator**

The current requirements document specifically defines flows for:
- **Student:** Write / submit peer evaluations
- **Professor:** Schedule peer evaluations
- **Professor:** Create groups
- **Professor:** Import courses and students

The app should follow the uploaded requirements document as the source of truth for business rules, workflows, validations, and entities. The provided high-fidelity mockups should be followed closely for visual direction on the student login page and the student peer evaluation submission flow.

---

## 2. Core Requirements from Uploaded Spec

Implement the system according to the requirements document, including at minimum:

### Student flow
- Student must log in
- Student sees courses they are in
- Student sees students in their group for the selected course
- Each group member should show status: `complete`, `incomplete`, or `in-progress`
- Groupmates already evaluated should appear lower in the list
- Student can open a peer evaluation form for a selected teammate
- Student cannot evaluate themself
- Student cannot evaluate someone outside their group
- Student cannot evaluate the same teammate more than once
- Student can save a draft
- Student can edit before the evaluation deadline
- On submit, store timestamp automatically
- Additional comments limited to **250 characters**
- Rubric must be complete before submit
- Store submission in database
- Show success confirmation after submit

### Evaluation criteria
For each target student being evaluated, support these scoring dimensions:
- Contribution to Team Project
- Facilitates Contributions of Others
- Planning and Management
- Fosters a Team Climate
- Overall

Scoring scale per rubric:
- 0 = Never
- 1 = Sometimes
- 2 = Usually
- 3 = Regularly
- 4 = Always

Also show total points earned out of total points possible.

### Professor flow: schedule evaluations
- Professor must only access their own courses
- Professor can navigate course → group → student
- Scheduled students should be ticked and appear lower in lists
- Must choose date and time
- Must prevent overlapping evaluations
- Must prevent scheduling the same student more than once
- Cannot schedule time in the past
- Comments limited to 250 characters
- Save schedule in database
- Automate notifications when assigned

### Professor flow: create groups
- Professor must only access their own courses
- Create group with a group name
- Group name max **20 characters**
- At least **2 students** required
- A student cannot be grouped more than once
- Already-grouped students should be unselectable and appear lower in lists
- Store created group in database
- Automate notifications to students when assigned

### Import flow
- Professor can manually import courses and students from SMU source
- Import only courses taught by the professor
- Do not duplicate previously imported courses

---

## 3. UI / UX Direction

Use the uploaded mockups as the visual baseline.

### Student login mockup
Match these characteristics closely:
- Dark navy top navigation bar
- App title on left: **Peer Evaluation System**
- Login area centered in the page
- Large white panel with subtle border / shadow
- Email and password inputs
- Login button in muted gold
- Simple academic enterprise styling
- Clean whitespace, not flashy

### Student peer evaluation mockup
Match these characteristics closely:
- Left sidebar navigation with items such as Dashboard, Peer Evaluations, Groups
- Dark navy top bar
- Main content area with heading **Submit Peer Evaluation**
- Form aligned in a clean 2-column layout where appropriate
- Right-side validation rules panel
- Buttons for Reset Fields, Save Draft, Submit Evaluation
- Success toast or confirmation bar after submit
- SMU branding / institutional design language

### Design system guidance
Use a minimal institutional UI theme:
- Primary navy: close to mockup
- Accent gold: close to mockup button color
- Soft gray backgrounds
- Clean borders, subtle shadows
- Rounded corners should be light, not overly modern
- Typography should feel academic / enterprise rather than startup-marketing

Suggested design tokens:
- `primary`: #232B63 or similar
- `accent`: #C6A75B or similar
- `bg`: #F3F3F3 to #F7F7F7
- `border`: #D9D9D9
- `text`: #222222

Do not invent a radically different UI. The mockups should drive layout and styling.

---

## 4. Recommended Tech Stack

### Frontend
- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** for accessible UI primitives where helpful
- **React Hook Form** for forms
- **Zod** for validation

### Backend
Use Next.js server capabilities for the app backend initially.

Recommended:
- **Next.js route handlers** for API endpoints
- **Prisma ORM** connected to **MySQL** on **Google Cloud SQL**
- Server-side auth/session handling

### Database
- **Google Cloud SQL (MySQL)**

### Integrations
- **Google Analytics** via global script / GA setup
- **Pabbly webhook** integration when webhook details are available

### Deployment
- Prefer deployment target that works well with Next.js and secure server-side environment variables
- Ensure Cloud SQL connectivity is configured safely for the deployment environment

---

## 5. Security and Environment Rules

Important: **Do not hardcode secrets in the codebase.**

The Cloud SQL credentials and connection values should be stored in `.env.local` for local development and environment secrets in deployment.

### Cloud SQL details provided
- Connection name: `project-0d707794-13fa-4bcf-a68:us-central1:bit4454`
- Public IP: `34.44.236.96`
- Port: `3306`
- Username: `neal_developer`
- Password: `Neal123$`

Claude Code should:
- Put these into environment variables
- Never commit them into source control
- Recommend rotating credentials before production if they were shared in plain text

Suggested env structure:

```env
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:3306/DB_NAME"
DB_HOST="34.44.236.96"
DB_PORT="3306"
DB_USER="neal_developer"
DB_PASSWORD="Neal123$"
DB_NAME="smu_peer_eval"
GA_MEASUREMENT_ID="G-C9RK9PHFK7"
PABBLY_WEBHOOK_URL=""
NEXTAUTH_SECRET="replace_me"
NEXTAUTH_URL="http://localhost:3000"
```

If using the Cloud SQL connection name directly for a connector/proxy workflow, support that in deployment documentation as well.

---

## 6. Google Analytics Requirements

Add Google Analytics to the app globally.

Measurement ID:
- `G-C9RK9PHFK7`

Implement GA so it loads on every page, ideally in the root layout.
Track at least:
- Page views
- Login page view
- Submit peer evaluation page view
- Successful peer evaluation submission
- Save draft action
- Group creation submission
- Scheduling submission

If event tracking is added, use a small analytics utility wrapper to keep usage consistent.

---

## 7. Pabbly Integration Requirements

Pabbly webhook URL is **not yet available**.

Design the code so Pabbly is pluggable and easy to activate later.

Create an integration service layer with placeholder functions such as:
- `sendEvaluationSubmittedWebhook(payload)`
- `sendEvaluationScheduledWebhook(payload)`
- `sendGroupCreatedWebhook(payload)`
- `sendImportCompletedWebhook(payload)`

Behavior:
- If webhook URL is not configured, fail silently but log safely in development
- Do not block the main product flow if webhook delivery fails
- Wrap webhook calls in try/catch
- Make webhook execution async where possible

Potential use cases for Pabbly later:
- Student notification when evaluation cycle opens
- Student notification when grouped
- Professor notification after successful schedule creation
- Admin reporting / automations

---

## 8. Authentication and Authorization

Implement role-based authentication.

Minimum roles:
- `student`
- `professor`
- `admin`

### Auth requirements
- Login page matching mockup
- Secure password handling
- Session-based auth
- Protected routes by role
- Server-side authorization checks on all data-fetching and mutations

### Authorization rules
- Students only access their own courses, own groups, and their required evaluations
- Students cannot evaluate themselves
- Students cannot evaluate outside their group
- Students cannot submit duplicate evaluations for the same target in the same cycle
- Students can only edit drafts / submissions before deadline
- Professors only access courses they teach
- Professors only manage groups and schedules within their own courses
- Admin can access broader system management if needed later

Do not rely on frontend checks alone. Enforce permissions on the server.

---

## 9. Recommended Information Architecture

Suggested app routes:

### Public
- `/login`

### Student
- `/student/dashboard`
- `/student/peer-evaluations`
- `/student/peer-evaluations/[courseId]`
- `/student/peer-evaluations/[courseId]/[targetStudentId]`
- `/student/groups`

### Professor
- `/professor/dashboard`
- `/professor/groups`
- `/professor/groups/create`
- `/professor/evaluations/schedule`
- `/professor/import`

### Admin
- `/admin/dashboard`

### APIs
- `/api/auth/*`
- `/api/student/evaluations/*`
- `/api/professor/groups/*`
- `/api/professor/schedule/*`
- `/api/professor/import/*`
- `/api/analytics/*` only if needed

---

## 10. Database Design

Use a normalized relational schema.

Suggested entities based on the requirements doc:

### User
- id
- smuIdentifier
- firstName
- lastName
- email
- passwordHash
- role
- isActive
- createdAt
- updatedAt

### Student
- id
- userId
- studentNumber
- createdAt
- updatedAt

### Professor
- id
- userId
- professorNumber
- createdAt
- updatedAt

### Course
- id
- externalCourseId
- courseCode
- courseName
- term
- professorId
- createdAt
- updatedAt

### ProjectGroup
- id
- courseId
- groupName
- createdAt
- updatedAt

### GroupMember
- id
- groupId
- studentId
- createdAt
- updatedAt

Add a unique constraint to prevent duplicate group membership within a course cycle if needed.

### EvaluationCycle
- id
- courseId
- title
- opensAt
- closesAt
- isActive
- createdAt
- updatedAt

### PeerEvaluation
- id
- evaluatorStudentId
- targetStudentId
- courseId
- groupId
- evaluationCycleId
- overallScore
- comments
- status (`draft`, `submitted`)
- totalPoints
- submittedAt
- createdAt
- updatedAt

Add unique constraint for:
- evaluatorStudentId + targetStudentId + evaluationCycleId

### PeerEvaluationScore
- id
- peerEvaluationId
- criterionKey
- score
- createdAt
- updatedAt

Use criterion values like:
- `contribution`
- `facilitates_contributions`
- `planning_management`
- `team_climate`
- `overall`

### EvaluationSchedule
- id
- studentId
- professorId
- courseId
- scheduledDateTime
- comments
- status
- createdAt
- updatedAt

Prevent overlapping schedules and duplicate schedule assignments as required.

### ImportJob
- id
- professorId
- source
- startedAt
- completedAt
- status
- metadataJson

---

## 11. Business Logic Rules

### Student evaluation rules
- Student can evaluate only group members from the same group
- Exclude self from target list
- Only one evaluation per target per evaluation cycle
- Allow draft save
- Allow editing draft any time before deadline
- Allow editing submitted evaluation only if requirements explicitly permit and deadline not passed
- Comments max 250 chars
- All rubric fields required for submission
- Submission timestamp generated on server
- Calculate total points on server

### Professor schedule rules
- Cannot schedule student twice for same relevant context
- Cannot schedule in past
- Cannot overlap with an existing schedule slot where overlap should be prevented
- Comments max 250 chars
- Save and trigger async notification / webhook

### Group creation rules
- Group name max 20 chars
- Minimum 2 students
- Student cannot be placed in more than one relevant group context
- Already-grouped students disabled in UI and rejected on server if attempted

### Import rules
- Import only professor-owned courses
- Do not create duplicates
- Keep import idempotent
- Log import result

---

## 12. Validation Requirements

Use Zod schemas shared between frontend and backend where possible.

### Student evaluation validation
- `courseId` required
- `targetStudentId` required
- all rubric scores required for submit
- score values must be integers 0–4
- comments max 250

Use clear validation messages such as:
- `Course is required.`
- `Group member is required.`
- `Contribution to Team Project must be completed.`
- `Comments cannot exceed 250 characters.`

### Schedule validation
- student required
- date required
- time required
- datetime cannot be in the past
- comments max 250

### Group validation
- course required
- group name required
- group name max 20
- minimum 2 students

---

## 13. Frontend Component Breakdown

Suggested reusable components:

### Layout
- `AppShell`
- `TopNav`
- `Sidebar`
- `PageHeader`
- `StatusBadge`

### Forms
- `LoginForm`
- `PeerEvaluationForm`
- `RubricScoreSelect`
- `CharacterCountTextarea`
- `GroupCreationForm`
- `ScheduleEvaluationForm`

### Feedback / messaging
- `FormErrorSummary`
- `InlineFieldError`
- `SuccessBanner`
- `ConfirmationCard`

### Data lists
- `CourseSelector`
- `GroupMemberList`
- `ProfessorCourseList`
- `StudentStatusList`

### Utility
- `ProtectedRouteGuard`
- `RoleGate`

---

## 14. Student Peer Evaluation Page Behavior

The student page should support:
- Course dropdown
- Group member dropdown or list
- Preloading existing draft if it exists
- Displaying the evaluation criteria with short descriptions
- 0–4 dropdowns for each criterion
- Live character count for comments
- Computed total points display
- Reset button
- Save draft button
- Submit button
- Disabled state while saving/submitting
- Success message after submission
- Link back to remaining evaluations or menu page

The right-side rules panel in the mockup should be present.

---

## 15. Import Strategy

Because the requirements mention importing from the SMU courses source, build the import feature as a manual professor-triggered process.

Recommended approach:
- Build a service layer: `lib/import/smu.ts`
- Parse remote course data if direct integration is possible
- If the source does not expose a clean API, prepare for either scraping or CSV/manual import fallback
- Ensure duplicate checks by `externalCourseId` or stable course identifiers

Since actual source access details may vary, keep this feature modular and behind a service abstraction.

---

## 16. Suggested Folder Structure

```txt
src/
  app/
    login/
      page.tsx
    student/
      dashboard/
        page.tsx
      peer-evaluations/
        page.tsx
        [courseId]/
          page.tsx
          [targetStudentId]/
            page.tsx
      groups/
        page.tsx
    professor/
      dashboard/
        page.tsx
      groups/
        page.tsx
        create/
          page.tsx
      evaluations/
        schedule/
          page.tsx
      import/
        page.tsx
    api/
      auth/
      student/
      professor/
  components/
    layout/
    forms/
    ui/
    feedback/
  lib/
    auth/
    db/
    validations/
    services/
    analytics/
    integrations/
    import/
  prisma/
    schema.prisma
```

---

## 17. Development Sequence for Claude Code

Claude Code should execute the build in this order:

### Phase 1 — Project setup
1. Initialize Next.js app with TypeScript and Tailwind
2. Add shadcn/ui
3. Add Prisma, mysql driver, Zod, React Hook Form
4. Configure env file support
5. Set up base layout and theme tokens
6. Add Google Analytics at root layout

### Phase 2 — Database and auth
1. Design Prisma schema
2. Create migrations
3. Seed test data for student, professor, admin, courses, groups, group members
4. Implement auth and role-based protected routing
5. Build login page per mockup

### Phase 3 — Student evaluation flow
1. Build student dashboard and peer evaluations list
2. Build group member list with status indicators
3. Build peer evaluation form per mockup
4. Add draft save API
5. Add submit API
6. Add validation and success flow

### Phase 4 — Professor features
1. Build create group flow
2. Build schedule evaluation flow
3. Build import flow shell and service abstraction

### Phase 5 — Integrations and polish
1. Add analytics events
2. Add Pabbly service wrapper
3. Improve empty states, loading states, and error handling
4. Add authorization hardening
5. Add test coverage

---

## 18. Quality Bar

Claude Code should aim for:
- Clean TypeScript types
- Reusable components
- No hardcoded secrets
- Strict server-side authorization
- Accessible forms and labels
- Clear validation messages
- Mobile responsiveness, even though primary usage may be desktop
- Production-minded code organization

Avoid:
- Monolithic page files
- Mixing business logic directly inside UI components
- Hardcoding database credentials
- Client-only authorization logic
- Overengineering beyond current requirements

---

## 19. Testing Requirements

Include at least:

### Unit tests
- Validation schemas
- Score total calculation
- Authorization helpers
- Duplicate submission prevention logic

### Integration tests
- Student can save draft
- Student can submit evaluation
- Student cannot evaluate self
- Student cannot submit incomplete rubric
- Professor can create valid group
- Professor cannot create group with fewer than 2 students
- Professor cannot schedule past date
- Professor cannot double-schedule same student

### Manual QA checklist
- Login works for each role
- Student sees only own courses / group members
- Student statuses render correctly
- Draft persists
- Submit stores timestamp
- Character limit enforced
- Success message renders
- Group creation validations work
- Scheduling validations work
- Analytics loads on all pages

---

## 20. Seed Data Expectations

Create realistic seed data for local development:
- 1 admin
- 2 professors
- 8–12 students
- 2–3 courses
- 2–3 groups per course where relevant
- 1 active evaluation cycle
- some draft evaluations
- some submitted evaluations

This is important so the app can be demoed immediately.

---

## 21. Deliverables Claude Code Should Produce

Claude Code should generate:
- Full Next.js application scaffold
- Prisma schema and migration files
- Seed script
- Auth implementation
- Student and professor feature pages
- Reusable components
- Analytics integration
- Placeholder Pabbly integration service
- README with local setup instructions
- `.env.example`

---

## 22. Open Items / Pending Inputs

These items are still needed or may need clarification:

1. **Pabbly webhook URL**
   - Still pending
   - Keep integration layer ready but inactive until provided

2. **Cloud SQL database name**
   - Not yet explicitly provided
   - Default suggestion: `smu_peer_eval`

3. **Auth source**
   - Need to confirm whether users are local app users, imported SMU users, or SSO-backed users
   - For now, assume app-managed login unless told otherwise

4. **Professor and admin mockups**
   - Only student-related hi-fi screens are currently available
   - Professor pages should follow the same design language unless more mockups arrive

5. **SMU import technical method**
   - Need confirmation whether import should use scraping, API, CSV, or manual upload fallback

6. **Notification rules**
   - Requirements mention automation / notifications
   - Need confirmation whether email, webhook, or both are desired

---

## 23. Final Instruction to Claude Code

Build the application to match the requirements document and uploaded mockups as closely as possible. Prioritize correctness of role-based access, evaluation workflows, database integrity, and clean implementation. Use a modular architecture so integrations like Pabbly and richer admin workflows can be added later without large rewrites.

When tradeoffs arise:
1. Follow the requirements document first
2. Follow the uploaded UI mockups second
3. Prefer secure, maintainable architecture over shortcuts
4. Keep the implementation practical and demo-ready
```

