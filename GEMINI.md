# Project: OVERSEER

## Project Overview

OVERSEER is a personal day planner designed with a unique Pip-Boy / Fallout terminal aesthetic. It's a single-user tool focused on providing full control over daily scheduling without subscriptions, ads, or bloat. The application allows users to plan their day across three time blocks, manage a global reusable task library, create and use day templates, track progress, and keep detailed notes for tasks. It features drag-and-drop task reordering, PWA capabilities for mobile installation, and cross-device synchronization through Supabase.

### Key Technologies:

*   **Frontend:** Vite, React 19, TypeScript (strict)
*   **Styling:** Custom CSS, JetBrains Mono font, CRT terminal aesthetic (scanlines, neon green `#00ff41`)
*   **State Management:** React's built-in state management
*   **Drag-and-Drop:** `@dnd-kit`
*   **Database & Auth:** Supabase (PostgreSQL with custom `overseer` schema)
*   **PWA:** `vite-plugin-pwa`
*   **Deployment:** Optimized for Netlify

## Building and Running

### Prerequisites

*   Node.js 18+
*   A Supabase project instance

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/overseer.git
    cd overseer
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    Copy the example environment file and fill in your Supabase credentials:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` with your Supabase project details:
    ```
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```
4.  **Initialize Supabase Database:**
    Run the `supabase/schema.sql` script in your Supabase SQL editor to set up the necessary database schema.

### Available Commands

*   **Development Server:** Runs the application in development mode.
    ```bash
    npm run dev
    ```
*   **Build for Production:** Compiles the application for deployment.
    ```bash
    npm run build
    ```
*   **Lint Code:** Runs ESLint to check for code quality and style issues.
    ```bash
    npm run lint
    ```
*   **Preview Production Build:** Serves the production build locally for testing.
    ```bash
    npm run preview
    ```

### Deployment (Netlify)

1.  Connect your GitHub repository to Netlify.
2.  **Build command:** `npm run build`
3.  **Publish directory:** `dist`
4.  Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in Netlify's site settings.
5.  Consider enabling Password Protection in Netlify for restricted access.

## Development Conventions

*   **Code Style:** Enforced using ESLint with recommended configurations for JavaScript, TypeScript, React Hooks, and Vite's React refresh plugin, as defined in `eslint.config.js`.
*   **TypeScript:** The project uses TypeScript in strict mode for improved code quality and type safety.
*   **Architecture:** Follows a component-based architecture for React, with clear separation of concerns (e.g., `components`, `hooks`, `lib` for Supabase client, `types`).
*   **Styling:** Relies on custom CSS files (`App.css`, `index.css`) rather than CSS frameworks or UI libraries, emphasizing the unique terminal aesthetic.
*   **PWA:** Configured to be an installable Progressive Web Application, including a manifest and service worker, as seen in `vite.config.ts`.
*   **No external UI libraries or CSS frameworks** are used, promoting a lightweight and highly customized UI.