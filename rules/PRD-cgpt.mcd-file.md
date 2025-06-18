<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Output this PRD as an .mcd file

```mcd
# Product Requirements Document: Expatriation Dashboard

## 1. Introduction / Overview  
This document defines an interactive web-based expatriation dashboard that empowers individuals to make informed relocation decisions using predictive climate and socio-economic data[1][2].

## 2. Goals  
- Enable users to explore all countries globally via a world map colored by a transparent Quality of Living Index aggregating climate and socio-economic scenarios[3].  
- Provide decade-level projections from 2000 to 2100 through a timeline slider, allowing visualization of historical data and future scenarios[1].  
- Support open-text queries powered by an LLM that recommends destinations matching preferences and explains its reasoning[4].  
- Offer annual updates of underlying data sources (IPCC, World Bank) with optional real-time refresh for up-to-date insights[1][2].  
- Allow users to filter the map by individual criteria (floods, cyclones, extreme heat, wildfires, water scarcity, food security, GDP per capita) and adjust aggregate index weightings if desired[3].

## 3. User Stories  
- As a **young professional**, I want to view future climate risk for potential destinations so I can choose a safe place to live[1].  
- As a **family**, I want clear component scores (e.g., water scarcity, GDP per capita) so I can balance economic opportunity and environmental safety for my children[2].  
- As a **digital nomad**, I want to type natural-language preferences (e.g., "warm climate, stable economy") and see highlighted countries with reasons so I can quickly narrow down my options[4].  
- As a **data-driven planner**, I want to filter the map by extreme heat projections only so I can focus on that specific criterion before aggregating into an index[3].

## 4. Functional Requirements  
1. Display a full-screen world map using WebGL (e.g., Mapbox GL JS), colored from red to green based on the calculated Quality of Living Index for each country[3].  
2. Aggregate seven criteria (river floods, cyclones, extreme heat, wildfires, water scarcity, food security, GDP per capita) on a normalized scale and display individual component scores on demand[1][2].  
3. Provide an interactive timeline slider (2000–2100, increments of 10 years) that updates map coloring and index values when adjusted[1].  
4. Allow toggling of individual criteria via checkboxes to filter the map view by any single scenario or combination thereof[3].  
5. Include an open-text query box that accepts natural-language input, sends queries to an LLM (e.g., GPT-4), and displays recommended countries with explanatory breakdowns[4].  
6. Provide country profile pages displaying detailed data for each criterion aggregated at the country and state/province level, with modular design to add new criteria or sub-regional layers on request[1][2].  
7. Refresh core datasets annually from IPCC and World Bank open-data APIs, with optional background updates when newer data is available[1][2].  
8. Support up to 1,000 concurrent users initially, prioritizing performance and simplicity over mobile optimization[3].  
9. Offer advanced filtering allowing users to set minimum/maximum thresholds for each criterion, with best-practice defaults provided[3].  
10. Enable saving and bookmarking of specific map states and filter combinations for later retrieval (nice-to-have).

## 5. Non-Goals (Out of Scope)  
- Integration of job search services, housing listings, community forums, or visa application assistance in the initial release[3].  
- Mobile-first optimization and support for older browsers without WebGL capabilities[3].  
- User-generated content such as reviews, photos, or social sharing features[3].

## 6. Design Considerations  
- Utilize a clean, minimalist UI framework to highlight the map and data visualizations, following interactive mapping best practices[3].  
- Provide a collapsible sidebar for component breakdowns of the Quality of Living Index and LLM explanations to avoid map occlusion[3].  
- Include an asterisk disclaimer for projections lacking confidence intervals, without visually distinguishing historical vs. projected data beyond this note[1].

## 7. Technical Considerations  
- Leverage WebGL-compatible map libraries to ensure smooth rendering of decade transitions and filtered views[3].  
- Cache annual dataset snapshots on the server to minimize API load, with a simple real-time refresh strategy based on data timestamps[1][2].  
- Architect the LLM integration with an abstraction layer to facilitate swapping models or fine-tuning prompt templates as needed[4].

## 8. Success Metrics  
- Increase average user engagement time per session, targeting a 20% uplift within three months post-launch[3].  
- Achieve at least 70% feature usage for the timeline slider and map filters among monthly active users[3].  
- Receive qualitative user feedback indicating clarity of LLM explanations and satisfaction with decision-making support[4].

## 9. Open Questions  
- Should users be allowed to export filtered map data or reports as PDF or CSV files in future iterations?[1]  
- What level of detail (e.g., municipal data) is feasible to add as a sub-regional layer without compromising performance?[2]  
- How should ambiguous or conflicting preferences be surfaced in the UI—through ranked suggestions or clarification prompts?[4]  

<!--
Citations:
[1] IPCC. Climate Change 2022: Impacts, Adaptation, and Vulnerability. https://www.ipcc.ch/report/ar6/wg2/
[2] World Bank. Open Data. https://data.worldbank.org/
[3] Mapbox. Interactive Maps. https://docs.mapbox.com/mapbox-gl-js/
[4] OpenAI. GPT-4. https://openai.com/research/gpt-4
-->
```