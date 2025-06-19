import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { indexService } from '../api/indexService';
import { BorderVerifier } from '../utils/borderVerification';
import BorderDiagnostics from './BorderDiagnostics';
import CountryProfile from './CountryProfile';
import axios from 'axios';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Apply filters to index data
 */
function applyFilters(indexData, filterState) {
  if (!filterState || !filterState.hasActiveFilters) {
    return indexData;
  }

  const filteredData = {};
  
  Object.keys(indexData).forEach(country => {
    const countryData = indexData[country];
    let includeCountry = true;
    
    // Apply individual criteria filters
    if (filterState.activeFilters.length > 0) {
      // If specific criteria are selected, only show countries based on those criteria
      const selectedScores = filterState.activeFilters.map(criterionId => {
        const criterionData = countryData.componentScores?.[criterionId];
        return criterionData?.score || 0;
      });
      
      // Calculate average of selected criteria
      const avgScore = selectedScores.length > 0 
        ? selectedScores.reduce((sum, score) => sum + score, 0) / selectedScores.length
        : 0;
      
      // Create modified country data with recalculated composite score
      filteredData[country] = {
        ...countryData,
        compositeScore: avgScore,
        filteredBy: 'criteria',
        selectedCriteria: filterState.activeFilters
      };
    } else {
      // Apply threshold filters
      Object.entries(filterState.thresholds).forEach(([criterionId, threshold]) => {
        if (threshold.enabled) {
          const criterionData = countryData.componentScores?.[criterionId];
          const score = criterionData?.score || 0;
          
          if (score < threshold.min || score > threshold.max) {
            includeCountry = false;
          }
        }
      });
      
      if (includeCountry) {
        filteredData[country] = {
          ...countryData,
          filteredBy: 'thresholds'
        };
      }
    }
  });
  
  return filteredData;
}

/**
 * Convert Quality of Living Index score (0-100) to color
 * Red (poor) to Yellow (medium) to Green (excellent)
 */
function scoreToColor(score, opacity = 0.8, isFiltered = false) {
  if (score === null || score === undefined || isNaN(score)) {
    return `rgba(200, 200, 200, ${opacity})`; // Gray for no data
  }
  
  // Normalize score to 0-1 range
  const normalizedScore = Math.max(0, Math.min(100, score)) / 100;
  
  let r, g, b;
  
  if (normalizedScore < 0.5) {
    // Red to Yellow (0-50 score range)
    const factor = normalizedScore * 2; // 0-1
    r = 255;
    g = Math.round(255 * factor);
    b = 0;
  } else {
    // Yellow to Green (50-100 score range)
    const factor = (normalizedScore - 0.5) * 2; // 0-1
    r = Math.round(255 * (1 - factor));
    g = 255;
    b = 0;
  }
  
  // Adjust opacity for filtered results
  const finalOpacity = isFiltered ? opacity * 0.6 : opacity;
  
  return `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
}

/**
 * Get country style based on data
 */
function getCountryStyle(countryCode, indexData, filterState, recommendedCountries, borderVerifier) {
  const filteredData = applyFilters(indexData, filterState);
  const recommendedCodes = new Set(
    recommendedCountries.map(rec => rec.countryCode || rec.country)
  );
  
  const countryData = filteredData[countryCode];
  const score = countryData?.compositeScore;
  
  // Get border validation results for this country
  const borderValidation = borderVerifier?.getCountryValidation(countryCode);
  const hasBorderIssues = borderValidation && !borderValidation.isValid;
  
  // Check if this country is recommended
  const isRecommended = recommendedCodes.has(countryCode);
  
  // Determine if country should be visible
  const isVisible = countryData !== undefined;
  const isFiltered = filterState?.hasActiveFilters && !isVisible;
  
  let fillColor, strokeColor, strokeWidth;
  
  if (isFiltered) {
    // Show filtered out countries in muted gray
    fillColor = 'rgba(220, 220, 220, 0.3)';
    strokeColor = 'rgba(180, 180, 180, 0.5)';
    strokeWidth = 0.5;
  } else if (hasBorderIssues) {
    // Highlight countries with border validation issues
    fillColor = scoreToColor(score, 0.6, false);
    strokeColor = '#dc2626'; // Red border for validation issues
    strokeWidth = 2;
  } else if (isRecommended) {
    // Highlight recommended countries
    fillColor = scoreToColor(score, 0.8, false);
    strokeColor = '#2563eb'; // Blue border for recommendations
    strokeWidth = 3;
  } else {
    fillColor = scoreToColor(score, 0.7, false);
    strokeColor = '#ffffff'; // White border as specified
    strokeWidth = 1;
  }
  
  return {
    fillColor,
    fillOpacity: 0.7,
    color: strokeColor,
    weight: strokeWidth,
    opacity: 1
  };
}

/**
 * Create recommendation markers
 */
function createRecommendationMarkers(recommendedCountries, countryCenters, map) {
  const markers = [];
  
  recommendedCountries.forEach((rec, index) => {
    const countryKey = rec.countryCode || rec.country;
    const coordinates = countryCenters[countryKey];
    
    if (coordinates) {
      // Create custom icon for recommendations
      const customIcon = L.divIcon({
        className: 'recommendation-marker',
        html: `<div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-white shadow-lg">${index + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      const marker = L.marker([coordinates[1], coordinates[0]], { icon: customIcon })
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-gray-900 mb-2">${rec.country}</h3>
            <div class="space-y-1 text-sm">
              <div>Quality Score: <span class="font-medium">${rec.score?.toFixed(1) || 'N/A'}/100</span></div>
              ${rec.rank ? `<div>Global Rank: <span class="font-medium">#${rec.rank}</span></div>` : ''}
              <div>AI Match: <span class="font-medium text-blue-600">${rec.matchPercentage || 85}%</span></div>
              ${rec.reasoning ? `<div class="mt-2 text-gray-700">${rec.reasoning}</div>` : ''}
            </div>
          </div>
        `)
        .addTo(map);
      
      markers.push(marker);
    }
  });
  
  return markers;
}

/**
 * Enhanced Interactive World Map Component using Leaflet.js
 */
const Map = ({ 
  selectedYear = 2020, 
  weightingScheme = 'equal',
  filterState = null,
  recommendedCountries = [],
  onCountryClick = null,
  onCountryHover = null,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const recommendationMarkersRef = useRef([]);
  const borderVerifierRef = useRef(new BorderVerifier());
  
  const [indexData, setIndexData] = useState({});
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [countryCenters, setCountryCenters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [borderValidationResults, setBorderValidationResults] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);
  const [showCountryProfile, setShowCountryProfile] = useState(false);

  // Load GeoJSON data and country centers on component mount
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading map data...');
        
        // Load GeoJSON data
        const geoJsonResponse = await axios.get('/data/countries.geojson');
        console.log('📊 GeoJSON loaded:', {
          type: geoJsonResponse.data.type,
          featureCount: geoJsonResponse.data.features?.length
        });
        
        // Validate GeoJSON structure
        if (!geoJsonResponse.data.features || !Array.isArray(geoJsonResponse.data.features)) {
          throw new Error('Invalid GeoJSON structure: missing features array');
        }
        
        setGeoJsonData(geoJsonResponse.data);
        
        // Load country centers
        const centersResponse = await axios.get('/data/country-centers.json');
        console.log('📍 Country centers loaded:', Object.keys(centersResponse.data).length, 'countries');
        setCountryCenters(centersResponse.data);
        
        // Run border validation
        if (geoJsonResponse.data) {
          console.log('🔍 Running border validation...');
          const validationResults = await borderVerifierRef.current.validateBorders(geoJsonResponse.data);
          setBorderValidationResults(validationResults);
          
          console.log('✅ Border validation complete:', {
            totalFeatures: validationResults.totalFeatures,
            validFeatures: validationResults.validFeatures,
            invalidFeatures: validationResults.invalidFeatures,
            totalIssues: validationResults.issues.length
          });
        }
        
      } catch (err) {
        console.error('❌ Failed to load map data:', err);
        setError('Failed to load map data. Using fallback data.');
        
        // Fallback to basic data if files can't be loaded
        setGeoJsonData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { ISO_A3: "USA", NAME: "United States" },
              geometry: {
                type: "Polygon",
                coordinates: [[[-125, 50], [-125, 25], [-65, 25], [-65, 50], [-125, 50]]]
              }
            }
          ]
        });
        
        setCountryCenters({
          'USA': [-95, 37],
          'United States': [-95, 37]
        });
      }
    };

    loadMapData();
  }, []);

  // Load index data for the selected year
  useEffect(() => {
    const loadIndexData = async () => {
      if (!geoJsonData) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🔄 Loading index data for year ${selectedYear} with ${weightingScheme} weighting...`);
        const data = await indexService.calculateCompositeIndex(selectedYear, weightingScheme);
        console.log('📊 Index data loaded:', {
          countries: Object.keys(data).length,
          sampleCountry: Object.keys(data)[0]
        });
        setIndexData(data);
      } catch (err) {
        console.error('❌ Failed to load index data:', err);
        setError('Failed to load map data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadIndexData();
  }, [selectedYear, weightingScheme, geoJsonData]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !geoJsonData || showCountryProfile) return;

    console.log('🗺️ Initializing Leaflet map...');

    try {
      // Create map instance
      const map = L.map(mapRef.current, {
        center: [0, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 10,
        zoomControl: true,
        attributionControl: true
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;

      // Validate features
      let validFeatures = 0;
      let invalidFeatures = 0;
      
      geoJsonData.features.forEach((feature) => {
        if (feature.geometry && ['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
          validFeatures++;
        } else {
          invalidFeatures++;
          console.warn(`❌ Invalid feature:`, feature.properties?.ISO_A3);
        }
      });

      console.log('📊 Feature validation summary:', { validFeatures, invalidFeatures });

      // Create GeoJSON layer with styling
      const geoJsonLayer = L.geoJSON(geoJsonData, {
        style: (feature) => {
          const countryCode = feature.properties?.ISO_A3;
          if (!countryCode) return { fillOpacity: 0, weight: 0 };
          
          return getCountryStyle(countryCode, indexData, filterState, recommendedCountries, borderVerifierRef.current);
        },
        onEachFeature: (feature, layer) => {
          const countryCode = feature.properties?.ISO_A3;
          const countryName = feature.properties?.NAME;
          
          if (!countryCode) return;

          // Mouse events
          layer.on({
            mouseover: (e) => {
              const layer = e.target;
              
              // Highlight on hover
              layer.setStyle({
                weight: 3,
                color: '#333333',
                fillOpacity: 0.9
              });
              
              layer.bringToFront();
              
              // Update hover state
              const filteredData = applyFilters(indexData, filterState);
              const countryData = filteredData[countryCode] || indexData[countryCode];
              const borderValidation = borderVerifierRef.current.getCountryValidation(countryCode);
              
              setHoveredCountry({
                code: countryCode,
                name: countryName,
                score: countryData?.compositeScore,
                ranking: countryData?.ranking,
                isFiltered: filterState?.hasActiveFilters && !filteredData[countryCode],
                filteredBy: countryData?.filteredBy,
                borderIssues: borderValidation && !borderValidation.isValid ? borderValidation.issues.length : 0
              });
              
              if (onCountryHover) {
                onCountryHover(countryCode, countryData);
              }
            },
            mouseout: (e) => {
              const layer = e.target;
              geoJsonLayerRef.current.resetStyle(layer);
              setHoveredCountry(null);
              
              if (onCountryHover) {
                onCountryHover(null, null);
              }
            },
            click: (e) => {
              const filteredData = applyFilters(indexData, filterState);
              const countryData = filteredData[countryCode] || indexData[countryCode];
              
              // Set selected country and show profile
              setSelectedCountryCode(countryCode);
              setShowCountryProfile(true);
              
              if (onCountryClick) {
                onCountryClick(countryCode, countryData);
              }
            }
          });

          // Bind popup with country information
          const filteredData = applyFilters(indexData, filterState);
          const countryData = filteredData[countryCode] || indexData[countryCode];
          
          if (countryData) {
            layer.bindPopup(`
              <div class="p-3">
                <h3 class="font-semibold text-gray-900 mb-2">${countryName}</h3>
                <div class="space-y-1 text-sm">
                  <div>Quality Score: <span class="font-medium" style="color: ${scoreToColor(countryData.compositeScore, 1)}">${countryData.compositeScore?.toFixed(1) || 'N/A'}/100</span></div>
                  ${countryData.ranking ? `<div>Global Rank: <span class="font-medium">#${countryData.ranking.rank} of ${countryData.ranking.totalCountries}</span></div>` : ''}
                  <div>Data Completeness: <span class="font-medium">${Math.round((countryData.dataCompleteness || 0) * 100)}%</span></div>
                  <div>Confidence: <span class="font-medium">${Math.round((countryData.confidence || 0) * 100)}%</span></div>
                  ${countryData.filteredBy ? `<div class="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Filtered by ${countryData.filteredBy}</div>` : ''}
                </div>
                <div class="mt-3 pt-2 border-t">
                  <button onclick="window.showCountryProfile('${countryCode}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Detailed Profile →
                  </button>
                </div>
              </div>
            `);
          }
        }
      }).addTo(map);

      geoJsonLayerRef.current = geoJsonLayer;

      console.log('✅ Leaflet map initialized successfully');

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      setError(`Map initialization failed: ${error.message}`);
    }
  }, [geoJsonData, showCountryProfile]);

  // Reinitialize map when returning from country profile
  useEffect(() => {
    if (!showCountryProfile && geoJsonData && mapRef.current && !mapInstanceRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        console.log('🔄 Reinitializing map after country profile...');
        // Force re-initialization by clearing the ref and triggering the effect
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showCountryProfile, geoJsonData]);

  // Global function for popup buttons
  useEffect(() => {
    window.showCountryProfile = (countryCode) => {
      setSelectedCountryCode(countryCode);
      setShowCountryProfile(true);
    };
    
    return () => {
      delete window.showCountryProfile;
    };
  }, []);

  // Update map styles when data changes
  useEffect(() => {
    if (geoJsonLayerRef.current && Object.keys(indexData).length > 0 && !showCountryProfile) {
      console.log('🎨 Updating map styles...');
      
      geoJsonLayerRef.current.eachLayer((layer) => {
        const feature = layer.feature;
        const countryCode = feature.properties?.ISO_A3;
        
        if (countryCode) {
          const style = getCountryStyle(countryCode, indexData, filterState, recommendedCountries, borderVerifierRef.current);
          layer.setStyle(style);
        }
      });
      
      console.log('✅ Map styles updated');
    }
  }, [indexData, filterState, recommendedCountries, showCountryProfile]);

  // Update recommendation markers
  useEffect(() => {
    if (mapInstanceRef.current && Object.keys(countryCenters).length > 0 && !showCountryProfile) {
      // Clear existing markers
      recommendationMarkersRef.current.forEach(marker => {
        mapInstanceRef.current.removeLayer(marker);
      });
      recommendationMarkersRef.current = [];
      
      if (recommendedCountries.length > 0) {
        console.log('📍 Adding recommendation markers:', recommendedCountries.length);
        const markers = createRecommendationMarkers(recommendedCountries, countryCenters, mapInstanceRef.current);
        recommendationMarkersRef.current = markers;
      }
    }
  }, [recommendedCountries, countryCenters, showCountryProfile]);

  // Clean up map when showing country profile
  useEffect(() => {
    if (showCountryProfile && mapInstanceRef.current) {
      console.log('🧹 Cleaning up map for country profile...');
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      geoJsonLayerRef.current = null;
      recommendationMarkersRef.current = [];
    }
  }, [showCountryProfile]);

  // Calculate filter statistics
  const getFilterStats = () => {
    if (!filterState?.hasActiveFilters || Object.keys(indexData).length === 0) {
      return null;
    }
    
    const filteredData = applyFilters(indexData, filterState);
    const totalCountries = Object.keys(indexData).length;
    const visibleCountries = Object.keys(filteredData).length;
    const hiddenCountries = totalCountries - visibleCountries;
    
    return {
      total: totalCountries,
      visible: visibleCountries,
      hidden: hiddenCountries,
      percentage: Math.round((visibleCountries / totalCountries) * 100)
    };
  };

  const filterStats = getFilterStats();

  // Show country profile if selected
  if (showCountryProfile && selectedCountryCode) {
    return (
      <div className={`w-full h-full ${className}`}>
        <CountryProfile
          countryCode={selectedCountryCode}
          selectedYear={selectedYear}
          weightingScheme={weightingScheme}
          onBack={() => {
            console.log('🔙 Returning to map from country profile...');
            setShowCountryProfile(false);
            setSelectedCountryCode(null);
          }}
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full bg-blue-50"
        style={{ minHeight: '400px' }}
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map data...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute top-4 left-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-sm">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}
      
      {/* Filter status indicator */}
      {filterStats && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-blue-200">
          <div className="text-sm">
            <div className="font-medium text-blue-900 mb-1">Filter Active</div>
            <div className="text-blue-700">
              Showing {filterStats.visible} of {filterStats.total} countries ({filterStats.percentage}%)
            </div>
          </div>
        </div>
      )}

      {/* Recommendations indicator */}
      {recommendedCountries.length > 0 && (
        <div className="absolute top-20 left-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg shadow-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">AI Recommendations</div>
            <div className="text-blue-100">
              {recommendedCountries.length} countries highlighted
            </div>
          </div>
        </div>
      )}
      
      {/* Hover tooltip */}
      {hoveredCountry && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-2">{hoveredCountry.name}</h3>
          {hoveredCountry.isFiltered ? (
            <p className="text-gray-500 text-sm">Filtered out by current criteria</p>
          ) : hoveredCountry.score !== null && hoveredCountry.score !== undefined ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Quality Score:</span>
                <span className="font-medium" style={{ color: scoreToColor(hoveredCountry.score, 1) }}>
                  {hoveredCountry.score.toFixed(1)}/100
                </span>
              </div>
              {hoveredCountry.ranking && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Global Rank:</span>
                  <span className="font-medium">
                    #{hoveredCountry.ranking.rank} of {hoveredCountry.ranking.totalCountries}
                  </span>
                </div>
              )}
              {hoveredCountry.borderIssues > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Border Issues:</span>
                  <span className="font-medium text-red-600">
                    {hoveredCountry.borderIssues}
                  </span>
                </div>
              )}
              {hoveredCountry.filteredBy && (
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Filtered by {hoveredCountry.filteredBy}
                </div>
              )}
              <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                Click to view detailed profile
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data available</p>
          )}
        </div>
      )}
      
      {/* Compact Legend - Always Visible */}
      <div className="absolute bottom-3 right-3 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
        <h4 className="font-medium text-gray-900 mb-2 text-xs">Quality Index</h4>
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: scoreToColor(90) }}></div>
            <span className="text-xs text-gray-600">Excellent (80+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: scoreToColor(70) }}></div>
            <span className="text-xs text-gray-600">Good (60-80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: scoreToColor(50) }}></div>
            <span className="text-xs text-gray-600">Average (40-60)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: scoreToColor(30) }}></div>
            <span className="text-xs text-gray-600">Poor (20-40)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: scoreToColor(10) }}></div>
            <span className="text-xs text-gray-600">Critical (0-20)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-gray-300"></div>
            <span className="text-xs text-gray-600">No Data</span>
          </div>
          
          {/* Additional legend items when applicable */}
          {filterStats && (
            <div className="flex items-center space-x-2 pt-1 border-t border-gray-200">
              <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
              <span className="text-xs text-gray-600">Filtered Out</span>
            </div>
          )}
          {recommendedCountries.length > 0 && (
            <div className="flex items-center space-x-2 pt-1 border-t border-gray-200">
              <div className="w-3 h-3 rounded-full bg-blue-600 border border-white"></div>
              <span className="text-xs text-gray-600">AI Recommended</span>
            </div>
          )}
          {borderValidationResults && borderValidationResults.issues.length > 0 && (
            <div className="flex items-center space-x-2 pt-1 border-t border-gray-200">
              <div className="w-3 h-3 rounded-sm border-2 border-red-600 bg-transparent"></div>
              <span className="text-xs text-gray-600">Border Issues</span>
            </div>
          )}
        </div>
      </div>

      {/* Border Diagnostics Modal */}
      {showDiagnostics && (
        <BorderDiagnostics
          geoJsonData={geoJsonData}
          indexData={indexData}
          filterState={filterState}
          recommendedCountries={recommendedCountries}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* Custom CSS for recommendation markers */}
      <style jsx>{`
        .recommendation-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default Map;