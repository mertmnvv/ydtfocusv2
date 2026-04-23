# YDT Focus: Academic Language Learning Platform

YDT Focus is an advanced, AI-integrated educational platform specifically engineered for students preparing for the YDT (Foreign Language Test) and other higher-level academic English examinations. The system leverages state-of-the-art language models and gamification frameworks to provide an optimized learning environment.

---

## Core Functional Modules

### Artificial Intelligence Integrated Reading & Analysis
*   **Contextual Text Generation:** Dynamic generation of academic passages based on CEFR levels (A2 through C1), tailored to exam-specific themes.
*   **Floating Analytical Interface:** An on-demand bottom sheet providing real-time semantic analysis, including translations and synonymous associations for selected tokens.
*   **Academic Vocabulary Highlighting:** Automated detection and visualization of high-frequency academic terminology (500+ prioritized tokens).
*   **Adaptive Assessment:** Automated generation of comprehension quizzes based on active reading context to ensure retention and understanding.

### Zero to Hero: Progressive Learning Path
*   **Hierarchical Syllabus:** A structured, level-based progression system designed to transition learners from foundational to advanced proficiency.
*   **Interactive Gamification:** Utilization of interactive matching and drag-and-drop mechanisms to enhance cognitive engagement.
*   **Performance Metrics:** Real-time tracking of student progress with integrated milestone verification.

### Intelligent Vocabulary Management
*   **Spaced Repetition System (SRS):** An optimized review algorithm designed to combat the forgetting curve and ensure long-term retention.
*   **Mistake Analytics:** Automated categorization of incorrect responses to facilitate focused remedial study.

### Specialized Focus Modules
*   **LineFocus Mode:** A minimalist reading environment designed to maximize concentration by isolating sentence-level context.

---

## Technical Architecture

*   **Frontend Framework:** Next.js 14 utilizing the App Router architecture.
*   **Backend Infrastructure:** Firebase Firestore for scalable data persistence and Firebase Authentication for secure identity management.
*   **AI Integration:** Groq Cloud API leveraging the Llama-3.1-8b-instant model for high-performance natural language processing.
*   **Styling & UI:** Modern design system implemented via Vanilla CSS, focusing on glassmorphism and premium dark mode aesthetics.
*   **State Management:** Robust data flow managed through React Context API and functional hooks.

---

## Installation and Deployment

To initialize the development environment:

1.  **Repository Acquisition:**
    ```bash
    git clone https://github.com/mertmnvv/ydtfocusv2.git
    ```

2.  **Dependency Resolution:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env.local` file in the root directory and populate it with the following parameters:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    GROQ_API_KEY=your_groq_api_key
    ```

4.  **Local Execution:**
    ```bash
    npm run dev
    ```

---

## Design Philosophy

The platform adheres to a "Premium Dark" aesthetic, utilizing glassmorphism to create depth and focus. User interface interactions are enhanced with high-performance CSS transitions and animations (bottom-sheet sliding, state transitions) to provide a seamless and professional user experience.

---

## Project Status

Developed and maintained by Mert with a focus on delivering high-fidelity academic tools for language learners.

---
*Disclaimer: YDT Focus is an educational support tool. Academic success remains dependent on individual study discipline and consistency.*
