// Border verification and debugging utilities
import { GeoJSON } from 'ol/format';
import { getArea, getLength } from 'ol/sphere';
import { transform } from 'ol/proj';

/**
 * Border Verification Utilities
 * Comprehensive tools for analyzing and fixing country border rendering issues
 */

// Geographic data validation constants
const VALIDATION_THRESHOLDS = {
  MIN_AREA_KM2: 1, // Minimum country area in km²
  MAX_AREA_KM2: 20000000, // Maximum reasonable country area
  MIN_PERIMETER_KM: 10, // Minimum perimeter
  MAX_VERTICES: 50000, // Maximum vertices per polygon
  COORDINATE_PRECISION: 6, // Decimal places for coordinates
  BORDER_TOLERANCE: 0.001 // Tolerance for border matching
};

// Known problematic country cases
const SPECIAL_CASES = {
  ARCHIPELAGOS: ['IDN', 'PHL', 'JPN', 'GRC', 'NOR'], // Countries with many islands
  ENCLAVES: ['VAT', 'SMR', 'LSO'], // Countries completely surrounded by others
  COMPLEX_BORDERS: ['IND', 'PAK', 'BGR', 'TUR'], // Countries with complex border shapes
  DISPUTED_TERRITORIES: ['PSE', 'TWN', 'XKX'], // Disputed or special status territories
  TRANSCONTINENTAL: ['RUS', 'TUR', 'EGY', 'KAZ'] // Countries spanning multiple continents
};

/**
 * Phase 1: Border Detection and Validation
 */
export class BorderVerifier {
  constructor() {
    this.validationResults = new Map();
    this.borderIssues = [];
    this.geoJsonFormat = new GeoJSON();
  }

  /**
   * Comprehensive border validation
   */
  async validateBorders(geoJsonData) {
    console.log('🔍 Starting comprehensive border validation...');
    
    const results = {
      totalFeatures: 0,
      validFeatures: 0,
      invalidFeatures: 0,
      issues: [],
      statistics: {},
      recommendations: []
    };

    if (!geoJsonData || !geoJsonData.features) {
      results.issues.push({
        type: 'CRITICAL',
        message: 'Invalid or missing GeoJSON data structure'
      });
      return results;
    }

    results.totalFeatures = geoJsonData.features.length;

    for (const feature of geoJsonData.features) {
      const validation = await this.validateSingleFeature(feature);
      
      if (validation.isValid) {
        results.validFeatures++;
      } else {
        results.invalidFeatures++;
        results.issues.push(...validation.issues);
      }

      // Store detailed results
      const countryCode = feature.properties?.ISO_A3;
      if (countryCode) {
        this.validationResults.set(countryCode, validation);
      }
    }

    // Generate statistics and recommendations
    results.statistics = this.generateStatistics();
    results.recommendations = this.generateRecommendations(results);

    console.log('✅ Border validation complete:', results);
    return results;
  }

  /**
   * Validate individual country feature
   */
  async validateSingleFeature(feature) {
    const result = {
      isValid: true,
      issues: [],
      metrics: {},
      countryCode: feature.properties?.ISO_A3,
      countryName: feature.properties?.NAME
    };

    try {
      // 1. Basic structure validation
      this.validateFeatureStructure(feature, result);

      // 2. Geometry validation
      this.validateGeometry(feature, result);

      // 3. Coordinate validation
      this.validateCoordinates(feature, result);

      // 4. Area and perimeter validation
      this.validateAreaAndPerimeter(feature, result);

      // 5. Border complexity validation
      this.validateBorderComplexity(feature, result);

      // 6. Special case validation
      this.validateSpecialCases(feature, result);

    } catch (error) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'VALIDATION_FAILURE',
        message: `Validation failed: ${error.message}`,
        feature: feature.properties?.ISO_A3
      });
    }

    return result;
  }

  /**
   * Validate feature structure
   */
  validateFeatureStructure(feature, result) {
    if (!feature.type || feature.type !== 'Feature') {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'STRUCTURE',
        message: 'Invalid feature type'
      });
    }

    if (!feature.properties) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'STRUCTURE',
        message: 'Missing properties object'
      });
    }

    if (!feature.properties?.ISO_A3) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'STRUCTURE',
        message: 'Missing ISO_A3 country code'
      });
    }

    if (!feature.geometry) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'STRUCTURE',
        message: 'Missing geometry object'
      });
    }
  }

  /**
   * Validate geometry structure and type
   */
  validateGeometry(feature, result) {
    const geometry = feature.geometry;
    
    if (!geometry.type) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'GEOMETRY',
        message: 'Missing geometry type'
      });
      return;
    }

    const validTypes = ['Polygon', 'MultiPolygon'];
    if (!validTypes.includes(geometry.type)) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'GEOMETRY',
        message: `Invalid geometry type: ${geometry.type}. Expected Polygon or MultiPolygon`
      });
      return;
    }

    if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'GEOMETRY',
        message: 'Missing or invalid coordinates array'
      });
      return;
    }

    // Validate coordinate structure based on geometry type
    if (geometry.type === 'Polygon') {
      this.validatePolygonCoordinates(geometry.coordinates, result);
    } else if (geometry.type === 'MultiPolygon') {
      this.validateMultiPolygonCoordinates(geometry.coordinates, result);
    }
  }

  /**
   * Validate polygon coordinates
   */
  validatePolygonCoordinates(coordinates, result) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'COORDINATES',
        message: 'Invalid polygon coordinates structure'
      });
      return;
    }

    // Validate each ring
    coordinates.forEach((ring, ringIndex) => {
      if (!Array.isArray(ring) || ring.length < 4) {
        result.isValid = false;
        result.issues.push({
          type: 'ERROR',
          category: 'COORDINATES',
          message: `Ring ${ringIndex} has insufficient coordinates (minimum 4 required)`
        });
        return;
      }

      // Check if ring is closed
      const firstPoint = ring[0];
      const lastPoint = ring[ring.length - 1];
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        result.isValid = false;
        result.issues.push({
          type: 'ERROR',
          category: 'COORDINATES',
          message: `Ring ${ringIndex} is not closed`
        });
      }
    });
  }

  /**
   * Validate multi-polygon coordinates
   */
  validateMultiPolygonCoordinates(coordinates, result) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      result.isValid = false;
      result.issues.push({
        type: 'ERROR',
        category: 'COORDINATES',
        message: 'Invalid multi-polygon coordinates structure'
      });
      return;
    }

    coordinates.forEach((polygon, polygonIndex) => {
      this.validatePolygonCoordinates(polygon, {
        ...result,
        issues: result.issues.map(issue => ({
          ...issue,
          message: `Polygon ${polygonIndex}: ${issue.message}`
        }))
      });
    });
  }

  /**
   * Validate coordinate values
   */
  validateCoordinates(feature, result) {
    const coordinates = this.extractAllCoordinates(feature.geometry);
    let invalidCoords = 0;
    let totalCoords = 0;

    coordinates.forEach(coord => {
      totalCoords++;
      const [lon, lat] = coord;

      // Validate longitude range
      if (lon < -180 || lon > 180) {
        invalidCoords++;
        if (invalidCoords <= 5) { // Limit error reporting
          result.issues.push({
            type: 'ERROR',
            category: 'COORDINATES',
            message: `Invalid longitude: ${lon} (must be between -180 and 180)`
          });
        }
      }

      // Validate latitude range
      if (lat < -90 || lat > 90) {
        invalidCoords++;
        if (invalidCoords <= 5) {
          result.issues.push({
            type: 'ERROR',
            category: 'COORDINATES',
            message: `Invalid latitude: ${lat} (must be between -90 and 90)`
          });
        }
      }

      // Check coordinate precision
      const lonPrecision = (lon.toString().split('.')[1] || '').length;
      const latPrecision = (lat.toString().split('.')[1] || '').length;
      
      if (lonPrecision > VALIDATION_THRESHOLDS.COORDINATE_PRECISION || 
          latPrecision > VALIDATION_THRESHOLDS.COORDINATE_PRECISION) {
        result.issues.push({
          type: 'WARNING',
          category: 'COORDINATES',
          message: `High coordinate precision detected (${Math.max(lonPrecision, latPrecision)} decimals)`
        });
      }
    });

    result.metrics.totalCoordinates = totalCoords;
    result.metrics.invalidCoordinates = invalidCoords;
    result.metrics.coordinateValidityRate = ((totalCoords - invalidCoords) / totalCoords) * 100;

    if (invalidCoords > 0) {
      result.isValid = false;
    }
  }

  /**
   * Validate area and perimeter
   */
  validateAreaAndPerimeter(feature, result) {
    try {
      const olFeature = this.geoJsonFormat.readFeature(feature, {
        featureProjection: 'EPSG:3857'
      });

      const geometry = olFeature.getGeometry();
      const area = getArea(geometry) / 1000000; // Convert to km²
      const perimeter = getLength(geometry) / 1000; // Convert to km

      result.metrics.areaKm2 = Math.round(area);
      result.metrics.perimeterKm = Math.round(perimeter);

      // Validate area
      if (area < VALIDATION_THRESHOLDS.MIN_AREA_KM2) {
        result.issues.push({
          type: 'WARNING',
          category: 'METRICS',
          message: `Very small area: ${area.toFixed(2)} km²`
        });
      }

      if (area > VALIDATION_THRESHOLDS.MAX_AREA_KM2) {
        result.issues.push({
          type: 'WARNING',
          category: 'METRICS',
          message: `Very large area: ${area.toFixed(2)} km²`
        });
      }

      // Validate perimeter
      if (perimeter < VALIDATION_THRESHOLDS.MIN_PERIMETER_KM) {
        result.issues.push({
          type: 'WARNING',
          category: 'METRICS',
          message: `Very small perimeter: ${perimeter.toFixed(2)} km`
        });
      }

      // Calculate shape complexity ratio
      const circularPerimeter = 2 * Math.sqrt(Math.PI * area);
      result.metrics.complexityRatio = perimeter / circularPerimeter;

    } catch (error) {
      result.issues.push({
        type: 'ERROR',
        category: 'METRICS',
        message: `Failed to calculate area/perimeter: ${error.message}`
      });
    }
  }

  /**
   * Validate border complexity
   */
  validateBorderComplexity(feature, result) {
    const coordinates = this.extractAllCoordinates(feature.geometry);
    const vertexCount = coordinates.length;

    result.metrics.vertexCount = vertexCount;

    if (vertexCount > VALIDATION_THRESHOLDS.MAX_VERTICES) {
      result.issues.push({
        type: 'WARNING',
        category: 'COMPLEXITY',
        message: `High vertex count: ${vertexCount} (may impact performance)`
      });
    }

    // Calculate average segment length
    let totalLength = 0;
    let segmentCount = 0;

    for (let i = 1; i < coordinates.length; i++) {
      const [lon1, lat1] = coordinates[i - 1];
      const [lon2, lat2] = coordinates[i];
      const distance = Math.sqrt(Math.pow(lon2 - lon1, 2) + Math.pow(lat2 - lat1, 2));
      totalLength += distance;
      segmentCount++;
    }

    result.metrics.averageSegmentLength = segmentCount > 0 ? totalLength / segmentCount : 0;
  }

  /**
   * Validate special cases
   */
  validateSpecialCases(feature, result) {
    const countryCode = feature.properties?.ISO_A3;
    
    if (SPECIAL_CASES.ARCHIPELAGOS.includes(countryCode)) {
      if (feature.geometry.type !== 'MultiPolygon') {
        result.issues.push({
          type: 'WARNING',
          category: 'SPECIAL_CASE',
          message: 'Archipelago country should use MultiPolygon geometry'
        });
      }
    }

    if (SPECIAL_CASES.ENCLAVES.includes(countryCode)) {
      result.issues.push({
        type: 'INFO',
        category: 'SPECIAL_CASE',
        message: 'Enclave country - verify surrounding country borders'
      });
    }

    if (SPECIAL_CASES.COMPLEX_BORDERS.includes(countryCode)) {
      result.issues.push({
        type: 'INFO',
        category: 'SPECIAL_CASE',
        message: 'Complex border country - extra validation recommended'
      });
    }
  }

  /**
   * Extract all coordinates from geometry
   */
  extractAllCoordinates(geometry) {
    const coordinates = [];

    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach(ring => {
        coordinates.push(...ring);
      });
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          coordinates.push(...ring);
        });
      });
    }

    return coordinates;
  }

  /**
   * Generate validation statistics
   */
  generateStatistics() {
    const stats = {
      totalCountries: this.validationResults.size,
      averageVertexCount: 0,
      averageArea: 0,
      averageComplexity: 0,
      geometryTypes: { Polygon: 0, MultiPolygon: 0 },
      issueCategories: {}
    };

    let totalVertices = 0;
    let totalArea = 0;
    let totalComplexity = 0;

    this.validationResults.forEach((validation, countryCode) => {
      if (validation.metrics) {
        totalVertices += validation.metrics.vertexCount || 0;
        totalArea += validation.metrics.areaKm2 || 0;
        totalComplexity += validation.metrics.complexityRatio || 0;
      }

      validation.issues.forEach(issue => {
        stats.issueCategories[issue.category] = (stats.issueCategories[issue.category] || 0) + 1;
      });
    });

    stats.averageVertexCount = Math.round(totalVertices / stats.totalCountries);
    stats.averageArea = Math.round(totalArea / stats.totalCountries);
    stats.averageComplexity = (totalComplexity / stats.totalCountries).toFixed(2);

    return stats;
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.invalidFeatures > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'DATA_QUALITY',
        message: `${results.invalidFeatures} countries have invalid geometry data and need fixing`
      });
    }

    const highComplexityCountries = Array.from(this.validationResults.entries())
      .filter(([_, validation]) => validation.metrics?.vertexCount > 10000)
      .length;

    if (highComplexityCountries > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE',
        message: `${highComplexityCountries} countries have high vertex counts - consider simplification`
      });
    }

    const coordinateIssues = results.issues.filter(issue => issue.category === 'COORDINATES').length;
    if (coordinateIssues > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'COORDINATES',
        message: `${coordinateIssues} coordinate validation issues found - check data source`
      });
    }

    return recommendations;
  }

  /**
   * Get validation results for a specific country
   */
  getCountryValidation(countryCode) {
    return this.validationResults.get(countryCode);
  }

  /**
   * Get all validation results
   */
  getAllValidationResults() {
    return Object.fromEntries(this.validationResults);
  }
}

/**
 * Phase 2: Border Rendering Fixes
 */
export class BorderRenderer {
  constructor() {
    this.renderingOptions = {
      strokeWidth: 1,
      strokeColor: '#666666',
      fillOpacity: 0.7,
      antiAliasing: true,
      bufferZone: 0.5,
      zoomLevelAdjustments: {
        1: { strokeWidth: 0.5 },
        2: { strokeWidth: 0.8 },
        3: { strokeWidth: 1.0 },
        4: { strokeWidth: 1.2 },
        5: { strokeWidth: 1.5 }
      }
    };
  }

  /**
   * Create optimized border style function
   */
  createBorderStyleFunction(indexData, filterState, recommendedCountries) {
    return (feature, resolution) => {
      const countryCode = feature.get('ISO_A3');
      const zoomLevel = this.getZoomLevelFromResolution(resolution);
      
      // Get base styling options for this zoom level
      const styleOptions = this.getStyleOptionsForZoom(zoomLevel);
      
      // Apply country-specific styling
      return this.createCountryStyle(countryCode, styleOptions, indexData, filterState, recommendedCountries);
    };
  }

  /**
   * Get zoom level from resolution
   */
  getZoomLevelFromResolution(resolution) {
    // Convert resolution to approximate zoom level
    const zoom = Math.round(Math.log2(156543.03392 / resolution));
    return Math.max(1, Math.min(10, zoom));
  }

  /**
   * Get style options adjusted for zoom level
   */
  getStyleOptionsForZoom(zoomLevel) {
    const baseOptions = { ...this.renderingOptions };
    const zoomAdjustments = this.renderingOptions.zoomLevelAdjustments[zoomLevel] || {};
    
    return { ...baseOptions, ...zoomAdjustments };
  }

  /**
   * Create style for individual country
   */
  createCountryStyle(countryCode, styleOptions, indexData, filterState, recommendedCountries) {
    // Implementation would go here - this is a placeholder for the actual styling logic
    // that would be integrated with the existing Map component
    return null;
  }

  /**
   * Validate border intersection detection
   */
  validateBorderIntersections(geoJsonData) {
    const intersectionIssues = [];
    const features = geoJsonData.features;

    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const feature1 = features[i];
        const feature2 = features[j];
        
        const intersection = this.checkBorderIntersection(feature1, feature2);
        if (intersection.hasIssues) {
          intersectionIssues.push({
            country1: feature1.properties.ISO_A3,
            country2: feature2.properties.ISO_A3,
            issues: intersection.issues
          });
        }
      }
    }

    return intersectionIssues;
  }

  /**
   * Check border intersection between two countries
   */
  checkBorderIntersection(feature1, feature2) {
    // Placeholder for intersection detection logic
    return {
      hasIssues: false,
      issues: []
    };
  }
}

/**
 * Phase 3: Color Application Validator
 */
export class ColorValidator {
  constructor() {
    this.colorIssues = [];
  }

  /**
   * Validate color application within borders
   */
  validateColorApplication(features, colorFunction) {
    const results = {
      totalFeatures: features.length,
      colorIssues: [],
      recommendations: []
    };

    features.forEach(feature => {
      const countryCode = feature.properties?.ISO_A3;
      const validation = this.validateFeatureColor(feature, colorFunction);
      
      if (!validation.isValid) {
        results.colorIssues.push({
          countryCode,
          issues: validation.issues
        });
      }
    });

    return results;
  }

  /**
   * Validate color for individual feature
   */
  validateFeatureColor(feature, colorFunction) {
    const result = {
      isValid: true,
      issues: []
    };

    try {
      const color = colorFunction(feature);
      
      if (!color) {
        result.isValid = false;
        result.issues.push('No color returned for feature');
      }

      // Validate color format
      if (typeof color === 'string') {
        if (!this.isValidColorString(color)) {
          result.isValid = false;
          result.issues.push(`Invalid color format: ${color}`);
        }
      }

    } catch (error) {
      result.isValid = false;
      result.issues.push(`Color function error: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate color string format
   */
  isValidColorString(color) {
    // Check for valid CSS color formats
    const colorRegex = /^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgba?\([^)]+\)|[a-zA-Z]+)$/;
    return colorRegex.test(color);
  }
}

// Export utilities for use in Map component
export const borderVerificationUtils = {
  BorderVerifier,
  BorderRenderer,
  ColorValidator,
  VALIDATION_THRESHOLDS,
  SPECIAL_CASES
};

export default borderVerificationUtils;