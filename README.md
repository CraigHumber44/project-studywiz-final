StudyWiz – Group Project Phase 2

Summary
Phase 2 focuses on setting up the core structure, layout, navigation, state management, and responsive styling for the StudyWiz application. The goal of this phase is not to complete full functionality but to establish a strong foundation that will support all advanced logic in Phase 3.
All required pages were created using the Next.js routing system, and major UI components were structured cleanly for reuse. The project now includes a fully designed dark theme, modular interface components, state based rendering, and mobile friendly behavior. Together, these elements demonstrate a solid intermediate level implementation of the project.

Detailed Explanation
This phase established the main structure of the Smart Study Planner and Tracker using Next.js file-based routing. All required pages (Home, Studies, Materials, Overview, Due Dates) are set up and load correctly with placeholder content. Navigation is handled through the Sidebar, giving users consistent access to each section of the application.

A complete component layout was created, including:
•	TopBar and TopBarBottom for title display and header organization
•	StudyControlsBar for selecting study time frames, dates, topics, and priority
•	Sidebar for user navigation
•	TimerPanel with Start, Pause, Stop, and Reset actions
•	SettingsPanel for theme, auto pause, and notifications
•	BottomSummaryBar for tracking completed study sessions
•	Footer with a floating Support banner
Styling was implemented using a dark theme with consistent spacing, flexible grid and flex layouts, and responsive behavior for mobile screens.
State management is now active in multiple components. The TimerPanel updates based on user actions, and the BottomSummaryBar uses conditional rendering to show the Save, No, and Delete buttons only after a session ends.
The entire project is well structured and prepared for Phase 3, where full functionality will be implemented.



Phase 2 Checklist
•	Routing and Structure
o	Routing implemented for Home, Studies, Materials, Overview, Due Dates
o	Sidebar navigation created and functioning
o	Project file structure organized into app, components, and public

•	Components Implemented
o	TopBar and TopBarBottom with centered application title
o	StudyControlsBar with time frame, date, topic, and priority controls
o	TimerPanel with Start, Pause, Stop, Reset
o	SettingsPanel with theme, auto pause, notifications
o	BottomSummaryBar with conditional Save, No, Delete buttons
o	Footer with Support button and floating support banner

•	Styling and Responsiveness
o	Dark theme UI applied across all pages
o	Consistent spacing and layout alignment
o	Responsive design for mobile screens
o	Sidebar collapses properly on smaller devices
o	Control bar rearranges into mobile layout

•	State Management
o	Timer state for running, paused, and stopped modes
o	BottomSummaryBar state for tracking completed topics
o	Conditional rendering used for session action buttons

