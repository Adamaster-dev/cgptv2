```markdown
## Relevant Files

- `package.json` – Updated with required dependencies including OpenLayers, axios, Jest, and Babel presets
- `babel.config.js` – Babel configuration for React, TypeScript, and modern JavaScript support
- `jest.config.js` – Jest testing configuration with jsdom environment and proper file handling
- `src/setupTests.js` – Jest setup file for testing library extensions
- `.env.example` – Template file showing required environment variables for OpenAI API keys
- `.env` – Local environment variables file with placeholder values (needs real API keys)
- `src/config/environment.ts` – Environment configuration module with validation for required API keys
- `src/api/dataService.js` – Module fetching and caching annual IPCC and World Bank datasets, handling missing data gracefully with mock data fallbacks
- `src/api/indexService.js` – Module computing the normalized Quality of Living Index from raw scenario values and exposing component scores with percentile-based normalization, composite index calculation, and advanced analysis features
- `src/components/Map.jsx` – React component rendering the interactive world map using OpenLayers with detailed GeoJSON data, coloring countries based on the Quality of Living Index with red-to-green gradient, filter support, and AI recommendation pins
- `src/components/Timeline.jsx` – React component for the decade slider (2000–2100) with clickable year markers and data confidence indicators that updates map data on change
- `src/components/Filters.jsx` – React component handling checkboxes and threshold inputs for individual scenario filtering with collapsible interface, criteria selection, and score thresholds
- `src/components/QueryBox.jsx` – React component for open-text input, sending queries to the LLM and displaying recommendations with explanations, sample queries, and query history
- `src/api/llmService.js` – Module interfacing with GPT-4 API for natural-language preference processing and explanation breakdowns with caching and error handling
- `src/styles/map.css` – Comprehensive CSS for map styling, controls, tooltips, legend, and responsive design
- `src/styles/timeline.css` – CSS for timeline component styling including custom slider, controls, animations, and responsive design
- `src/App.tsx` – Main application component with map, timeline, filters, and AI query integration, year/weighting controls, and country selection display
- `public/data/countries.geojson` – Detailed GeoJSON file containing country boundaries with proper ISO codes and geographic data
- `public/data/country-centers.json` – JSON file containing country center coordinates for recommendation pins and map centering
- `src/index.html` – Main HTML file that initializes the application and loads styles and scripts[^1].  
- `src/components/CountryProfile.jsx` – React component displaying detailed criterion data for selected country and its states/provinces[^2].  
- `src/utils/storage.js` – Utilities for saving and retrieving bookmarked map states and filter configurations[^2].  
- `tests/Map.test.js` – Unit tests for map rendering logic and color scaling based on index values[^2].  
- `tests/Timeline.test.js` – Unit tests ensuring the slider triggers appropriate data updates[^2].  
- `tests/Filters.test.js` – Unit tests for checkbox toggles and threshold input behavior[^2].  
- `tests/QueryBox.test.js` – Unit tests covering LLM request formatting and response display[^3].  
- `tests/CountryProfile.test.js` – Unit tests validating country and state data presentation logic[^2].  

### Notes

- Place unit tests alongside related components to maintain clear context and ensure fast localized test runs[^2].  
- Use `npm test` or `npx jest [path/to/test]` to run tests; omitting a path runs all tests[^2].
- OpenLayers is used instead of Mapbox GL JS for the interactive world map to avoid account creation requirements
- Detailed GeoJSON data is now loaded from external files for better country boundary accuracy

## Tasks

- [x] 1.0 Initialize project repository and environment setup  
  - [x] 1.1 Create project structure with `src/`, `tests/`, and configuration files (`package.json`, `.babelrc`, `.eslintrc`)[^1].  
  - [x] 1.2 Install dependencies: React, OpenLayers, axios, Jest, and relevant Babel presets[^1].  
  - [x] 1.3 Configure environment variables for LLM API key[^3].  

- [x] 2.0 Develop data ingestion pipeline and Quality of Living index computation module  
  - [x] 2.1 Implement `dataService.js` to fetch annual datasets from IPCC and World Bank, cache locally, and handle missing data fallbacks[^1].  
  - [x] 2.2 Normalize raw scenario values across countries and years in `indexService.js` to compute each criterion's score (0–100 scale)[^1].  
  - [x] 2.3 Aggregate normalized scores into a composite index with equal weighting by default and expose component breakdowns[^1].  

- [x] 3.0 Implement interactive world map component with timeline slider and filter controls  
  - [x] 3.1 In `Map.jsx`, integrate OpenLayers to render countries colored by index value using a red-to-green gradient[^2].  
  - [x] 3.2 Develop `Timeline.jsx` to allow decade selection (2000–2100) and trigger re-fetch of index values for the selected year[^2].  
  - [x] 3.3 Build `Filters.jsx` with checkboxes for each scenario and threshold inputs; link filter state to map display logic[^2].  

- [x] 4.0 Integrate natural-language query box with LLM recommendation and explanation display  
  - [x] 4.1 Create `QueryBox.jsx` capturing user input and calling `llmService.js` with prompt templates covering basic to complex preferences[^3].  
  - [x] 4.2 Implement `llmService.js` to send requests to GPT-4, parse recommended countries, and extract explanation breakdowns[^3].  
  - [x] 4.3 Display LLM results as map pins with tooltips summarizing matching criteria and reasoning details[^3].  

- [x] 4.4 Implement detailed country GeoJSON data integration
  - [x] 4.4.1 Create comprehensive GeoJSON file with accurate country boundaries and ISO codes
  - [x] 4.4.2 Add country center coordinates file for recommendation pin placement
  - [x] 4.4.3 Update Map component to load external GeoJSON data with proper error handling
  - [x] 4.4.4 Enhance recommendation pin system with accurate country center positioning

- [ ] 5.0 Create country profile pages showing detailed criteria breakdown at country and state levels  
  - [ ] 5.1 Implement click handler in `Map.jsx` to navigate to `CountryProfile.jsx` with selected country code[^2].  
  - [ ] 5.2 In `CountryProfile.jsx`, fetch component scores for the latest selected year and render charts or tables for each criterion[^2].  
  - [ ] 5.3 Add state/province layer toggle to display sub-regional data when available, ensuring modular extension for future criteria additions[^2].  

- [ ] 6.0 Add bookmarking functionality and advanced threshold-based filtering (nice-to-have)  
  - [ ] 6.1 Implement bookmark save/load in `storage.js` storing map state and filters in `localStorage`[^2].  
  - [ ] 6.2 Extend `Filters.jsx` to include min/max input fields for each criterion with best-practice defaults and validation logic[^2].  

```

<div style="text-align: center">⁂</div>

[^1]: PRD-cgpt.mcd-file.md