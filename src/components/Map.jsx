import React, { useEffect, useRef, useState } from 'react';
import { Map as OLMap, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { Style, Fill, Stroke, Circle, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { indexService } from '../api/indexService';
import { BorderVerifier } from '../utils/borderVerification';
import BorderDiagnostics from './BorderDiagnostics';
import axios from 'axios';

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
 * Create enhanced style function with border validation
 */
function createCountryStyleFunction(indexData, filterState, recommendedCountries, borderVerifier) {
  const filteredData = applyFilters(indexData, filterState);
  const recommendedCodes = new Set(
    recommendedCountries.map(rec => rec.countryCode || rec.country)
  );
  
  return function(feature, resolution) {
    const countryCode = feature.get('ISO_A3');
    const countryName = feature.get('NAME');
    const countryData = filteredData[countryCode];
    const originalData = indexData[countryCode];
    const score = countryData?.compositeScore;
    
    // Get border validation results for this country
    const borderValidation = borderVerifier?.getCountryValidation(countryCode);
    const hasBorderIssues = borderValidation && !borderValidation.isValid;
    
    // Check if this country is recommended
    const isRecommended = recommendedCodes.has(countryCode) || recommendedCodes.has(countryName);
    
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
      strokeColor = scoreToColor(score, 1.0, false);
      strokeWidth = 1;
    }
    
    // Adjust stroke width based on zoom level
    const zoomLevel = getZoomLevelFromResolution(resolution);
    const adjustedStrokeWidth = strokeWidth * Math.max(0.5, Math.min(2, zoomLevel / 3));
    
    return new Style({
      fill: new Fill({
        color: fillColor
      }),
      stroke: new Stroke({
        color: strokeColor,
        width: adjustedStrokeWidth
      })
    });
  };
}

/**
 * Get zoom level from resolution
 */
function getZoomLevelFromResolution(resolution) {
  return Math.round(Math.log2(156543.03392 / resolution));
}

/**
 * Create hover style for country features
 */
function createHoverStyle(feature, indexData, filterState, borderVerifier) {
  const countryCode = feature.get('ISO_A3');
  const filteredData = applyFilters(indexData, filterState);
  const countryData = filteredData[countryCode] || indexData[countryCode];
  const score = countryData?.compositeScore;
  
  const isFiltered = filterState?.hasActiveFilters && !filteredData[countryCode];
  const borderValidation = borderVerifier?.getCountryValidation(countryCode);
  const hasBorderIssues = borderValidation && !borderValidation.isValid;
  
  let fillColor, strokeColor, strokeWidth;
  
  if (isFiltered) {
    fillColor = 'rgba(220, 220, 220, 0.5)';
    strokeColor = '#999999';
    strokeWidth = 2;
  } else if (hasBorderIssues) {
    fillColor = scoreToColor(score, 0.9);
    strokeColor = '#dc2626'; // Red for border issues
    strokeWidth = 3;
  } else {
    fillColor = scoreToColor(score, 0.9);
    strokeColor = '#333333';
    strokeWidth = 2;
  }
  
  return new Style({
    fill: new Fill({
      color: fillColor
    }),
    stroke: new Stroke({
      color: strokeColor,
      width: strokeWidth
    })
  });
}

/**
 * Create recommendation pin features
 */
function createRecommendationPins(recommendedCountries, countryCenters) {
  const features = [];
  
  recommendedCountries.forEach((rec, index) => {
    const countryKey = rec.countryCode || rec.country;
    const coordinates = countryCenters[countryKey];
    
    if (coordinates) {
      const feature = new Feature({
        geometry: new Point(fromLonLat(coordinates)),
        recommendation: rec,
        index: index + 1
      });
      
      features.push(feature);
    }
  });
  
  return features;
}

/**
 * Create style for recommendation pins
 */
function createPinStyle(feature) {
  const index = feature.get('index');
  
  return new Style({
    image: new Circle({
      radius: 12,
      fill: new Fill({
        color: '#2563eb'
      }),
      stroke: new Stroke({
        color: '#ffffff',
        width: 2
      })
    }),
    text: new Text({
      text: index.toString(),
      fill: new Fill({
        color: '#ffffff'
      }),
      font: 'bold 12px sans-serif'
    })
  });
}

/**
 * Enhanced Interactive World Map Component with Border Validation
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
  const vectorLayerRef = useRef(null);
  const pinsLayerRef = useRef(null);
  const hoveredFeatureRef = useRef(null);
  const borderVerifierRef = useRef(new BorderVerifier());
  
  const [indexData, setIndexData] = useState({});
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [countryCenters, setCountryCenters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [borderValidationResults, setBorderValidationResults] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Load GeoJSON data and country centers on component mount
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        
        // Load GeoJSON data
        const geoJsonResponse = await axios.get('/data/countries.geojson');
        setGeoJsonData(geoJsonResponse.data);
        
        // Load country centers
        const centersResponse = await axios.get('/data/country-centers.json');
        setCountryCenters(centersResponse.data);
        
        // Run border validation
        if (geoJsonResponse.data) {
          console.log('🔍 Running border validation...');
          const validationResults = await borderVerifierRef.current.validateBorders(geoJsonResponse.data);
          setBorderValidationResults(validationResults);
          
          // Log validation summary
          console.log('✅ Border validation complete:', {
            totalFeatures: validationResults.totalFeatures,
            validFeatures: validationResults.validFeatures,
            invalidFeatures: validationResults.invalidFeatures,
            totalIssues: validationResults.issues.length
          });
          
          // Log any critical issues
          const criticalIssues = validationResults.issues.filter(issue => issue.type === 'ERROR');
          if (criticalIssues.length > 0) {
            console.warn('⚠️ Critical border issues found:', criticalIssues);
          }
        }
        
      } catch (err) {
        console.error('Failed to load map data:', err);
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
        const data = await indexService.calculateCompositeIndex(selectedYear, weightingScheme);
        setIndexData(data);
      } catch (err) {
        console.error('Failed to load index data:', err);
        setError('Failed to load map data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadIndexData();
  }, [selectedYear, weightingScheme, geoJsonData]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !geoJsonData) return;

    // Create vector source and layer for countries
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(geoJsonData, {
        featureProjection: 'EPSG:3857'
      })
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: createCountryStyleFunction(indexData, filterState, recommendedCountries, borderVerifierRef.current)
    });

    vectorLayerRef.current = vectorLayer;

    // Create pins layer for recommendations
    const pinsSource = new VectorSource();
    const pinsLayer = new VectorLayer({
      source: pinsSource,
      style: createPinStyle
    });

    pinsLayerRef.current = pinsLayer;

    // Create map instance
    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer,
        pinsLayer
      ],
      view: new View({
        center: fromLonLat([0, 20]), // Center on world
        zoom: 2,
        minZoom: 1,
        maxZoom: 10
      })
    });

    mapInstanceRef.current = map;

    // Add interaction handlers
    map.on('pointermove', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      
      if (feature !== hoveredFeatureRef.current) {
        // Reset previous hover
        if (hoveredFeatureRef.current) {
          hoveredFeatureRef.current.setStyle(undefined);
        }
        
        if (feature && feature.get('ISO_A3')) {
          // Apply hover style to country features only
          feature.setStyle(createHoverStyle(feature, indexData, filterState, borderVerifierRef.current));
          const countryCode = feature.get('ISO_A3');
          const countryName = feature.get('NAME');
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
        } else if (feature && feature.get('recommendation')) {
          // Handle pin hover
          const rec = feature.get('recommendation');
          setHoveredCountry({
            code: rec.countryCode || rec.country,
            name: rec.country,
            score: rec.score,
            ranking: { rank: rec.rank },
            isRecommendation: true,
            matchPercentage: rec.matchPercentage
          });
        } else {
          setHoveredCountry(null);
          if (onCountryHover) {
            onCountryHover(null, null);
          }
        }
        
        hoveredFeatureRef.current = feature;
      }
      
      // Change cursor style
      map.getTargetElement().style.cursor = feature ? 'pointer' : '';
    });

    map.on('click', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      
      if (feature && onCountryClick) {
        if (feature.get('ISO_A3')) {
          // Country click
          const countryCode = feature.get('ISO_A3');
          const filteredData = applyFilters(indexData, filterState);
          const countryData = filteredData[countryCode] || indexData[countryCode];
          onCountryClick(countryCode, countryData);
        } else if (feature.get('recommendation')) {
          // Pin click
          const rec = feature.get('recommendation');
          onCountryClick(rec.countryCode || rec.country, rec.actualData);
        }
      }
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(null);
        mapInstanceRef.current = null;
      }
    };
  }, [geoJsonData]);

  // Update map styles when index data or filters change
  useEffect(() => {
    if (vectorLayerRef.current && Object.keys(indexData).length > 0) {
      const styleFunction = createCountryStyleFunction(indexData, filterState, recommendedCountries, borderVerifierRef.current);
      vectorLayerRef.current.setStyle(styleFunction);
      
      // Reset hover state
      if (hoveredFeatureRef.current) {
        hoveredFeatureRef.current.setStyle(undefined);
        hoveredFeatureRef.current = null;
      }
      setHoveredCountry(null);
    }
  }, [indexData, filterState, recommendedCountries]);

  // Update recommendation pins
  useEffect(() => {
    if (pinsLayerRef.current && Object.keys(countryCenters).length > 0) {
      const pinsSource = pinsLayerRef.current.getSource();
      pinsSource.clear();
      
      if (recommendedCountries.length > 0) {
        const pinFeatures = createRecommendationPins(recommendedCountries, countryCenters);
        pinsSource.addFeatures(pinFeatures);
      }
    }
  }, [recommendedCountries, countryCenters]);

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
      
      {/* Border validation status */}
      {borderValidationResults && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
          <div className="text-sm">
            <div className="font-medium text-gray-900 mb-1">Border Validation</div>
            <div className="text-gray-700">
              {borderValidationResults.validFeatures}/{borderValidationResults.totalFeatures} valid
              {borderValidationResults.issues.length > 0 && (
                <span className="text-red-600 ml-2">
                  ({borderValidationResults.issues.length} issues)
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDiagnostics(true)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              View Details
            </button>
          </div>
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
              {hoveredCountry.isRecommendation && (
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Match:</span>
                  <span className="font-medium text-blue-600">
                    {hoveredCountry.matchPercentage}%
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
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data available</p>
          )}
        </div>
      )}
      
      {/* Enhanced Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Quality of Living Index</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: scoreToColor(90) }}></div>
            <span className="text-xs text-gray-600">Excellent (80-100)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: scoreToColor(70) }}></div>
            <span className="text-xs text-gray-600">Good (60-80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: scoreToColor(50) }}></div>
            <span className="text-xs text-gray-600">Average (40-60)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: scoreToColor(30) }}></div>
            <span className="text-xs text-gray-600">Poor (20-40)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: scoreToColor(10) }}></div>
            <span className="text-xs text-gray-600">Critical (0-20)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-gray-300"></div>
            <span className="text-xs text-gray-600">No Data</span>
          </div>
          {filterStats && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <div className="w-4 h-4 rounded bg-gray-200"></div>
              <span className="text-xs text-gray-600">Filtered Out</span>
            </div>
          )}
          {recommendedCountries.length > 0 && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
              <span className="text-xs text-gray-600">AI Recommended</span>
            </div>
          )}
          {borderValidationResults && borderValidationResults.issues.length > 0 && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <div className="w-4 h-4 rounded border-2 border-red-600"></div>
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
    </div>
  );
};

export default Map;