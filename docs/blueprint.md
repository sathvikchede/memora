# **App Name**: Memora AI

## Core Features:

- Knowledge Input: Allow users to input information manually, through replies, or by processing chat logs, which becomes the basis for Memora AI's knowledge.
- Intelligent Summarization: Use AI to summarize and categorize user-provided information, updating existing summaries with similar content and creating new summaries for new topics. Employs reasoning as a tool for categorization and contextualization of input.
- Query and Response System: Enable users to query the AI and receive answers based on relevant summaries, along with sources, contributors, and dates, so the AI uses the summaries to build answers with a reasoning tool to connect them to queries. Returns the raw data with contributors.
- Credit System: Implement a credit system where users earn credits for contributing information, which are then used when querying the AI.
- Multimedia Understanding: Process information from uploaded media (images, files, voice), understanding the content, so the AI uses it as an input. Media is not stored, but the extracted text is summarized.
- User Authentication and Profiles: Allow users to log in via Google account, create profiles, and display credits.
- Space Management: Allow users to create and manage isolated spaces for information sharing, with invite links for collaboration. Each space acts as an isolated data container.

## Style Guidelines:

- Dark Mode: Background should be black (#000000) with white (#FFFFFF) text and UI elements. Light Mode: Background should be white (#FFFFFF) with black (#000000) text and UI elements.
- Font: 'Inter' (sans-serif) for both headlines and body text to maintain a clean and consistent user interface.
- Web: Fixed sidebar on the left with a thin line separator. Mobile: Collapsible sidebar, transitions to icon buttons with 'm.' logo. Each with the seven different tabs available in Memora.
- Custom icons for sidebar buttons (ask: '?', add: '+', help: '!', chat: message bubble, people: three people, space: circle with ring, profile: person). Consistent throughout the platform.
- Primary color: Use a bright, desaturated white for all the buttons in both light and dark theme. When a button is clicked, inverts color so text changes.
- In Ask tab and Add tab text input should use an expanding box from a single to five lines in web version. In the mobile version expanding should go until 3 lines are there