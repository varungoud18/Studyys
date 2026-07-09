# 🎓 Studyys - AI Study Assistant for Engineering Students

**Studyys** is a premium, production-grade AI-powered study portal designed specifically for Computer Science & Engineering (CSE) students. It enables students to upload textbooks, syllabus documents, and lecture notes, then leverage AI (via Google Gemini 1.5 Flash) to chat with documents, auto-compile multiple-choice quizzes, study using interactive 3D flashcards, and share vetted guides in a student-moderated campus library.

---

## 🌟 Key Features

*   💬 **AI Chat Assistant:** Upload textbook chapters or syllabus PDFs. Query complex concepts, formulas, or code blocks. The tutor answers using contextual document chunks, provides confidence scores, and lists source page numbers.
*   📝 **Dynamic Quiz Generator:** Automatically compile 10 multiple-choice questions from your notes. Includes timer counters, performance grading metrics, and comprehensive explanation dialogues.
*   🎴 **3D Flip Flashcards:** Memorize definitions, formulas, and structures using active recall flashcard decks with beautiful 3D flipping card transitions.
*   📚 **Vetted Shared Library:** Publish study guides and cheat sheets. Features community upvoting, branch/semester filters, and a moderator validation queue.
*   🛡️ **Moderator Administration:** Authorized student-moderators can review library submissions, assign roles (Student, Moderator, Admin), and track logs.
*   📊 **Academic Analytics:** Monitor your study hours, quiz scores, and subject distribution with clean charts powered by Recharts.

---

## 🛠️ File Structure

The workspace follows a highly organized, modular folder hierarchy:

```text
Studyys/
├── src/
│   ├── context/          # Global Auth Provider (Supabase Auth & Dev Sandbox)
│   ├── layouts/          # Responsive App Navigation sidebar & header shell
│   ├── routes/           # Protected Route component validation
│   ├── services/         # Supabase Client & Google Gemini API integrations
│   ├── pages/            # Feature Views
│   │   ├── auth/         # Sign In & Sign Up interfaces
│   │   ├── dashboard/    # Overview dashboards, progress tracking, & stats
│   │   ├── study/        # Ask AI tutor, Quiz generator, & Flashcards
│   │   ├── library/      # Shared Library note view & submissions
│   │   ├── moderator/    # Moderator validation queue & role editor
│   │   ├── analytics/    # Recharts analytics charts & logs export
│   │   └── profile/      # User settings & historical activity logs
│   ├── App.tsx           # Route definitions & React Query provider wrapper
│   ├── main.tsx          # React application root entrypoint
│   └── index.css         # Styling system (Vanilla CSS & Tailwind variables)
├── supabase_schema.sql   # PostgreSQL schema migrations (RLS, triggers, indexes)
├── DOCUMENTATION.md      # Full architecture documentation & 30 Viva Q&As
└── README.md             # Project documentation (this file)
```

---

## 🚀 Local Setup & Execution

Follow these steps to run Studyys on your local machine:

### 1. Pre-requisites
*   Make sure you have [Node.js (v18+)](https://nodejs.org/) installed.

### 2. Install Project Dependencies
Run the package manager from the root of your project:
```bash
npm install
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory (or update the existing one) with your credentials:
```env
# Supabase Integration Configurations
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API Key
VITE_GEMINI_API_KEY=your-google-gemini-api-key
```

*Note: If no credentials are provided, Studyys will run in **Mock Sandbox Mode** enabling offline testing of all views.*

### 4. Supabase Database Schema
1. Create a new project in your [Supabase Dashboard](https://supabase.com/).
2. Open the **SQL Editor** tab.
3. Copy the contents of the `supabase_schema.sql` file in this repository and execute the script. This will set up the PostgreSQL tables, RLS policies, indexes, and user triggers.

### 5. Launch the App
Start the Vite local development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Enabling Google OAuth Sign-In

To allow users to sign in with their Google Accounts:

1.  **Google Cloud Console Setup:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create an OAuth client ID for a **Web application**.
    *   Add this redirect URI to the OAuth credentials:
        `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
    *   Copy your **Client ID** and **Client Secret**.
2.  **Supabase Console Configuration:**
    *   Open your Supabase Dashboard.
    *   Go to **Authentication** > **Providers** > **Google**.
    *   Enable the provider and enter your Client ID and Client Secret.
3.  **Run:** Open Studyys and click **Sign in with Google** on the login page!
