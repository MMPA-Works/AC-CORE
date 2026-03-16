# AC-CORE (Angeles City Center for Operational Reporting and Engineering)

AC-CORE is a modern municipal maintenance and incident reporting system. It is designed to connect the everyday citizens of Angeles City directly with local government engineering departments.

## About the Project

Angeles City faces unique environmental threats. During heavy monsoon rains, volcanic lahar sand from Mount Pinatubo washes into the streets and chokes the underground drainage networks. This creates rapid surface flooding that destroys roads and paralyzes the local economy.

Currently, when a citizen reports a broken streetlight or a dangerously clogged drain, their complaint goes into a hidden bureaucracy. We call this the "black box". The citizen never hears back, which creates civic apathy. As a result, people simply stop reporting hazards. This forces the local government to rely on slow manual inspections, keeping the city trapped in a cycle of expensive emergency repairs.

## The Solution and Impact

AC-CORE replaces the reactive legacy systems with a highly proactive digital platform.

By using our system, the local government can catch micro-infrastructure failures early. Clearing a blocked drain based on a quick citizen report is exponentially cheaper than rebuilding a completely eroded roadway after a flood. Most importantly, patching dangerous potholes and managing hazards early drastically reduces traffic accidents in busy commercial zones like Barangay Balibago. AC-CORE empowers citizens, protects local infrastructure, and ultimately saves lives.

## Key Features

### Citizen Mobile Interface
Designed to work smoothly on budget smartphones with very low memory usage.
* **Guest Reporting:** A fast reporting form that does not force the user to create an account during emergencies.
* **Auto-Detect GPS:** A button that grabs the exact location coordinates instantly.
* **Smart Hazard Tagging:** Dropdown menus to select the specific barangay and the type of hazard (such as a pothole or fallen tree).
* **Severity Buttons:** Color-coded options to mark the issue as a Low, Medium, or Critical hazard.
* **Direct Camera Upload:** Allows users to snap and upload a photo directly within the app.
* **The "Pizza Tracker":** A visual status timeline showing the citizen exactly if their report is "Reported", "Dispatched", or fully "Resolved".

### LGU Command Center
A desktop dashboard built for city engineers and disaster risk officers to manage incoming data.
* **Top Analytics Row:** Real-time data cards showing total active incidents, critical hazards, dispatched crews, and resolved issues.
* **Interactive Clustered Heatmap:** A massive central map that groups hazard pins together to keep the browser running fast. Clicking a pin reveals the uploaded photo and exact details.
* **Critical Status Chart:** A bar graph displaying which neighborhoods currently have the most severe problems.
* **Live Work Order Feed:** A tabular list of incoming reports that automatically refreshes every 30 seconds.
* **One-Click Dispatch:** An "Assign Crew" button that instantly updates the database and pushes the new status back to the citizen's tracker.

### Automated System Logic
* **Paved Paradox Sorter:** Automatically prioritizes reports coming from heavily paved commercial zones to prevent economic bottlenecks.
* **Simplified Flow Mapping:** Maps the connection between a high-elevation hazard and the closest low-elevation neighborhood to predict downstream flooding.

## Technology Stack

We specifically chose tools that guarantee fast performance and high reliability.
* **Frontend Framework:** Angular 21 (using the new Zoneless architecture for low memory usage).
* **Component Library:** Spartan UI and Tailwind CSS.
* **Mapping Library:** Leaflet.js with the MarkerCluster plugin.
* **Backend Server:** Node.js with Express.js.
* **Database:** MongoDB.
* **Image Storage:** Cloudinary (for automatic image compression).

## The Team
Developed by **MMPA Works**, a dedicated team of developers from the School of Computing at Holy Angel University.
* **Ian Macabulos:** Lead Full-Stack and UI/UX Developer
* **Kian Angeles:** Project Manager and QA Lead
* **Kris Madlambayan:** Backend Systems and Database Architect
* **Mikko Pangilinan:** Geospatial Data Analyst