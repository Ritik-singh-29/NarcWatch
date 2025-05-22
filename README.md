# NarcWatch
Overview of Narcwatch Project
Narcwatch is a sophisticated web application designed to detect drug-related content on websites through advanced content scanning and metadata analysis. It leverages modern web technologies and APIs to provide a comprehensive analysis, including threat scoring, keyword detection, and domain verification. Below is a detailed breakdown of the project, its features, technologies used, and suggestions for creating a compelling LinkedIn post to showcase your work.

Project Details
Purpose
Narcwatch is an innovative tool aimed at identifying potential drug-related content on websites by scanning for over 350 drug-related terms, analyzing metadata, and providing threat scores based on detected keywords. It also verifies whether a domain is trusted, reducing false positives for legitimate websites.

Key Features
Drug Content Detection:
Scans website content for a comprehensive list of over 350 drug-related keywords, including illicit drugs, prescription drugs, slang terms, marijuana strains, edibles, synthetic drugs, dark web terminology, and more.
Generates a threat score (0–100%) based on the frequency and category of detected keywords, with weighted scoring for different categories (e.g., illicit drugs, dark web terms).
Visualizes top 20 detected terms in a fixed-height bar chart using Chart.js, with color-coded bars for different drug categories.
Trusted Domain Verification:
Maintains a whitelist of trusted domains (e.g., google.com, wikipedia.org, gov.in, etc.) to quickly identify legitimate websites.
Displays a "Trusted Site" badge with a 0% threat score for whitelisted domains.
Website Intelligence Report:
Extracts and displays detailed metadata, including:
Domain Details: Domain name, page title, meta description, keywords, author, robots, and favicon.
Hosting Details: IP address, ISP, and server location (using Google DNS and ipapi.co APIs).
Security Details: Protocol (HTTP/HTTPS), content type, and site name.
Contact Info: Emails, phone numbers, and physical addresses extracted from the website.
Social Links: Links to social media platforms (e.g., Facebook, Twitter, Instagram).
Allows users to export the report as a JSON file for further analysis.
Historical Scans:
Stores up to 10 previous scans in local storage, with the ability to view past results.
Displays scan history with timestamps and URLs, allowing users to revisit previous analyses.
Interactive UI/UX:
Features a light and dark mode toggle with smooth transitions and gradient animations.
Includes glassmorphism design for cards, floating particle animations, and responsive layouts for mobile and desktop.
Provides visual feedback with progress rings, loading animations, and toast notifications for clipboard actions.
Security and Privacy:
Warns users about potential privacy redactions or unavailable data due to protection services.
Uses HTTPS checks to indicate website security.
Technologies Used
Frontend:
HTML5: Structure of the web application.
CSS3 with Tailwind CSS: Styling with utility-first classes, custom animations (e.g., gradient, float, pulse), and responsive design.
Font Awesome: Icons for visual enhancement.
Google Fonts (Poppins): Modern typography for better readability.
Chart.js: For rendering bar charts of top drug-related terms.
JavaScript:
Vanilla JavaScript: Handles form submission, DOM manipulation, and API calls.
Local Storage: Stores scan history.
DOMParser: Extracts metadata from HTML content.
Regular Expressions: Matches keywords, emails, phone numbers, and addresses.
APIs:
allorigins.win: Bypasses CORS restrictions to fetch website content.
Google DNS API: Resolves domain to IP address.
ipapi.co: Retrieves geolocation and ISP data for the IP address.
Other:
Live Server: For development with live reloading.
WebSocket: Enables live reload functionality during development.
How It Works
User Input: Users enter a website URL in the input field and click "Analyze."
Domain Check: The application extracts the domain and checks it against a whitelist of trusted domains.
Content Analysis:
If the domain is trusted, it displays a "Trusted Site" badge with minimal details.
If not trusted, it fetches the website’s HTML content, scans for drug-related keywords, and calculates a threat score.
Metadata Extraction: Extracts metadata, contact info, and social links using regex and DOM parsing.
Visualization: Displays results with a progress ring for the threat score, a bar chart for term frequency, and a detailed website intelligence report.
History Management: Saves scan results to local storage and displays them in a history section.
