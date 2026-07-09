# Technical Documentation: AI Study Assistant for Engineering Students

## 1. Abstract
The AI Study Assistant is a specialized, collaborative, active-learning web platform engineered specifically for Computer Science and Engineering (CSE) students. Utilizing client-side document processing (PDF.js), LangChain.js text segmentation, Google Gemini 1.5 Flash LLM, and Supabase Serverless PG, the application empowers students to digest dense textbooks, consult a virtual academic tutor, generate customized mock exams (MCQs), practice vocabulary via 3D interactive flashcards, and share peer-reviewed study sheets.

---

## 2. System Architecture & ASCII Diagram

### High-Level Architecture Flow

```text
       +--------------------------------------------------------+
       |                  CLIENT FRONTEND                       |
       |  React 18, TypeScript, Tailwind CSS, Recharts, Router  |
       +-------+--------------------+-------------------+-------+
               |                    |                   |
               | (Auth/Query/DB)    | (Parse/Chunk)     | (Prompt/Tutor)
               v                    v                   v
      +--------+---------+   +------+------+   +--------+--------+
      |  SUPABASE CLOUD  |   |   PDF.JS    |   |  GOOGLE GEMINI  |
      |  Auth & Postgres |   | Client-Side |   |  1.5 Flash API  |
      |  Storage Buckets |   | Text Parser |   |   (AI Studio)   |
      +------------------+   +-------------+   +-----------------+
```

---

## 3. Database Design
The database uses a normalized PostgreSQL structure running under Supabase. The schema enforces integrity using primary keys, foreign keys (with cascading actions), value constraints, index pointers for performance, and Row Level Security (RLS) tables.

### Database ER Schema Summary
- **`profiles`**: Syncs with Supabase Auth users. Maintains roles (`student`, `moderator`, `admin`).
- **`subjects`**: Course index (e.g., CSE-302 Operating Systems).
- **`documents`**: PDF materials metadata including URL paths, pages, and parsing statuses.
- **`document_chunks`**: Segmented document snippets used to feed relevant context to the Gemini LLM.
- **`questions`**: Conversations history between students and Gemini.
- **`quizzes` & `quiz_questions`**: Test repositories and generated multiple choice items.
- **`quiz_attempts`**: Track student records, scoring statistics, and correct answers.
- **`flashcards`**: Vocabulary flip cards.
- **`library_notes`**: Crowd-sourced materials awaiting approval by moderators.

---

## 4. API & Service Design

### Client Services
1. **`supabase.ts`**: Client connector providing session tokens for secure database and storage writes.
2. **`gemini.ts`**: Connects queries, context text blocks, and academic depth modifiers ('easy', 'medium', 'hard') into JSON structures from the Gemini model.

---

## 5. Folder Structure
```text
d:\studyys/
├── src/
│   ├── components/       # Reusable components
│   ├── context/          # Auth context and providers
│   ├── hooks/            # Custom hooks
│   ├── layouts/          # Responsive App shell
│   ├── pages/            # Page modules (Dashboard, Upload, AskAI, etc.)
│   ├── routes/           # Protected routes
│   ├── services/         # Supabase & Gemini endpoints
│   ├── types/            # DB TypeScript types
│   ├── utils/            # Time and formatting utilities
│   ├── App.tsx           # React entry routing
│   ├── index.css         # Styling, glassmorphism, card flip animations
│   └── main.tsx          # DOM render
├── package.json          # Node dependencies
├── tsconfig.json         # TypeScript compiler configurations
├── tailwind.config.js    # Blue/White design theme configurations
└── supabase_schema.sql   # Postgres database migrations, RLS policies, and indexes
```

---

## 6. Authentication & Authorization Flow
```text
  [User Signs Up / Logs In]
             │
             ▼
  [Supabase Auth Session Created]
             │
             ▼
  [Trigger Function handle_new_user()]
             │
             ▼
  [Inserts row in public.profiles table] ──► [Grants Role: 'student' | 'moderator' | 'admin']
                                                                  │
                                                                  ▼
                                                      [Routes Protected by Role]
```

---

## 7. AI Retrieval & Chat Workflow
1. **Extraction:** The user uploads a PDF. PDF.js processes the binary stream and extracts textual content page-by-page.
2. **Chunking:** The text is segmented into overlapping blocks of ~1,000 characters.
3. **Retrieval:** When a student asks a question, matching chunks are identified using text similarity algorithms.
4. **LLM Synthesis:** The matching chunks, question, and difficulty level are formatted into a prompt and sent to Gemini, which returns a structured answer.

---

## 8. 30 Viva Questions & Answers (Project Defense Guide)

### Q1: What is the main objective of this AI Study Assistant project?
**A:** To provide engineering students with an integrated, intelligent workspace that uses Google Gemini to query, summarize, and generate exams based on dense lecture notes or textbooks.

### Q2: Why did you choose React with TypeScript instead of pure JavaScript?
**A:** TypeScript adds static type safety, preventing compilation errors, enhancing IDE autocomplete, and creating strict interfaces for Supabase database responses.

### Q3: What is the purpose of the `profiles` table in Supabase, and how is it populated?
**A:** The `profiles` table stores extended user details like semester, branch, college, and roles. It is automatically populated using a PostgreSQL trigger function that executes after a user registers via Supabase Auth.

### Q4: Explain the role-based authentication design used in this system.
**A:** The application has three roles: `Student`, `Moderator`, and `Admin`. Routes are protected by a wrapper component that checks the role property in the user's profile, restricting pages like `/moderator` to staff members.

### Q5: How does the PDF.js library work in your application?
**A:** It parses PDF files client-side, reading pages, rendering canvas layouts, and extracting text lines to avoid server-side document processing bottlenecks.

### Q6: What is a "chunk" and why is text chunking necessary for LLM generation?
**A:** Large Language Models have context length limits and pricing variables. Segmenting a 200-page book into smaller, overlapping chunks allows the app to send only the most relevant sections of text as context for the query.

### Q7: Explain the retrieval strategy implemented in the Ask AI component.
**A:** The system locates text chunks containing terms that match the user's question, package them as context, and queries the LLM to get a grounded answer based on the document's content.

### Q8: How does the Google Gemini API interface with the React frontend?
**A:** It uses the `@google/generative-ai` package to send prompts containing the retrieved text chunks, user query, and formatting constraints directly to the `gemini-1.5-flash` model.

### Q9: How do you prevent LLM "hallucinations" in the Ask AI chat?
**A:** The prompt instructs the model to answer the query *only* using the provided text context. If the answer is not in the text, the model states that it cannot find the information in the document.

### Q10: How are multiple-choice quiz questions generated using AI?
**A:** The system sends document context to Gemini and instructs it to output a structured JSON array containing 10 MCQs, each with options, the correct answer index, and an explanation.

### Q11: Explain the purpose of Row Level Security (RLS) in Supabase.
**A:** RLS prevents users from accessing or modifying other users' database rows. For example, a student can read only their own documents because of the query check: `auth.uid() = user_id`.

### Q12: Why are indexes created on tables like `document_chunks` and `library_notes`?
**A:** Indexing fields like `document_id` and `status` speeds up database queries, ensuring the app remains responsive as the volume of documents and shared notes grows.

### Q13: How is the flashcard flip animation styled in Tailwind CSS?
**A:** It uses CSS 3D transforms (`perspective`, `transform-style: preserve-3d`, and `backface-visibility: hidden`). Clicking the card toggles a classes state that rotates the card by 180 degrees.

### Q14: Explain the difference between TCP and UDP headers as queried by students.
**A:** TCP headers (20-60 bytes) include fields for connection tracking, sequencing, and flow control. UDP headers are small (8 bytes) and focus on low-latency delivery.

### Q15: How does the Shared Library moderate user submissions?
**A:** New notes are uploaded with a status of `pending`. Moderators approve or reject these submissions from their dashboard, making approved notes public in the library.

### Q16: What is the significance of the `activity_logs` table?
**A:** It tracks user actions (e.g., logging in, taking quizzes, uploading PDFs) to generate study activity metrics and charts on the user's dashboard.

### Q17: What charting library is used, and what does it visualize?
**A:** Recharts is used to build responsive charts displaying study hours, quiz scores, and subject distribution statistics.

### Q18: What file size and type constraints are enforced in the PDF Upload component?
**A:** The system allows only files of type `application/pdf` with a maximum size of 15MB to optimize processing speed and storage capacity.

### Q19: Explain the concept of "aging" in CPU scheduling, which might be tested in a quiz.
**A:** Aging is a technique that gradually increases the priority of low-priority processes waiting in the queue, preventing starvation.

### Q20: How does the application maintain session persistence?
**A:** Supabase stores access and refresh tokens in local storage. On page load, the client checks for these tokens to restore the user's session without requiring them to log in again.

### Q21: What is a deadlock, and what are its four necessary conditions?
**A:** A deadlock is a state where processes are unable to proceed because each is waiting for resources held by another. The conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.

### Q22: Why is Zod used in conjunction with React Hook Form?
**A:** Zod defines strict, type-safe validation schemas for forms. React Hook Form uses these schemas to validate inputs before submitting data, preventing malformed requests.

### Q23: How do you handle empty states and loading skeletons?
**A:** Skeletons mimic the layout of cards, tables, and charts using grey placeholders animated with a pulsing effect. Empty states use friendly icons and instructions to guide users on what to do next.

### Q24: What is the purpose of the `.env` file?
**A:** It stores sensitive API endpoints and access keys separate from the codebase, preventing credentials from being exposed in public code repositories.

### Q25: How does the "Mock Sandbox" benefit development?
**A:** It lets developers test frontend features, routing, and UI components locally without needing an active database connection or API key.

### Q26: Explain the difference between primary keys and foreign keys.
**A:** A primary key uniquely identifies a row in a table. A foreign key links a row in one table to a unique row in another, enforcing referential integrity.

### Q27: How does the application prevent XSS attacks?
**A:** React automatically escapes values rendered in JSX, and Zod validates inputs to ensure they contain only safe, expected text structures.

### Q28: How is the database migration managed?
**A:** A single `supabase_schema.sql` file contains all schema definitions, RLS rules, and triggers, allowing developers to set up the database in any PostgreSQL environment.

### Q29: What future scopes exist for this project?
**A:** Adding real-time voice consultations, support for engineering diagrams using vision models, and collaborative study rooms.

### Q30: Why is Gemini 1.5 Flash selected over other models?
**A:** It features a large context window, fast processing speeds, and low latency, making it ideal for client-side chat and analysis tasks.
