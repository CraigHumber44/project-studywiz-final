# StudyWiz – Smart Study Planner and Tracker (Phase 3)

StudyWiz is a smart study planner and tracker developed as the final group project for CPAN 144 (Advanced Front-End Programming). The goal of this application is to help students plan, manage, and track their study sessions in a structured and user-friendly way.

The app allows users to set study time frames, select topics and priorities, and run timed study sessions using a built-in timer. After each session, users can review and manage completed sessions while keeping the interface clean through conditional rendering.

## Key Features
- StudyControlsBar for selecting study time frames, topics, dates, and priorities
- TimerPanel with start, pause, stop, and reset functionality
- Sidebar navigation across Home, Studies, Materials, Overview, and Due Dates
- BottomSummaryBar that appears only after a session is completed
- Responsive dark-themed user interface

## Technologies Used
- Next.js with React
- Component-based architecture
- React Hooks (useState, useEffect) for state management
- CSS Modules for styling and responsive layout

## Project Structure
The application uses Next.js file-based routing and a modular folder structure to keep components reusable and maintainable. Shared state is managed through lifted state and props to ensure consistent data flow across components.

## Phase 3 Focus
Phase 3 focused on finalizing component behavior, refining UI responsiveness, cleaning up logic and state flow, and preparing the project for future performance optimizations. While not all advanced features were implemented, the current structure supports future expansion.

## Limitations and Future Improvements
Due to time constraints, some planned features such as AI-generated study questions, advanced analytics, external API integration, and backend persistence were not fully implemented. These features are planned for future versions of the application.

## Course Concepts Demonstrated
This project demonstrates key CPAN 144 concepts including component-based design, state management with React Hooks, conditional rendering, event handling, responsive UI design, and scalable project organization.
