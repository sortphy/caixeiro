/**
 * City Generator for ACO Simulation
 * Allows users to generate random city maps with a specified number of cities
 */

class CityGenerator {
  constructor() {
    this.defaultCities = {
      ids: ['A', 'B', 'C', 'D'],
      positions: {
        'A': { x: 200, y: 200 },
        'B': { x: 141.7, y: 320.8 },
        'C': { x: 306.1, y: 49.0 },
        'D': { x: 15.5, y: 109.2 }
      },
      distances: {
        'A-B': 10, 'B-A': 10,
        'A-C': 15, 'C-A': 15,
        'A-D': 20, 'D-A': 20,
        'B-C': 35, 'C-B': 35,
        'B-D': 25, 'D-B': 25,
        'C-D': 30, 'D-C': 30
      }
    };
    this.svgWidth = 400;
    this.svgHeight = 400;
    this.padding = 30; // Padding from edges
  }

  // Generate city IDs (A, B, C, ...)
  generateCityIds(numCities) {
    const ids = [];
    for (let i = 0; i < numCities; i++) {
      ids.push(String.fromCharCode(65 + i % 26) + (i >= 26 ? Math.floor(i / 26) : ''));
    }
    return ids;
  }

  // Generate random positions for each city
  generatePositions(cityIds) {
    const positions = {};
    const availableArea = {
      minX: this.padding,
      maxX: this.svgWidth - this.padding,
      minY: this.padding,
      maxY: this.svgHeight - this.padding
    };

    cityIds.forEach(id => {
      positions[id] = {
        x: Math.random() * (availableArea.maxX - availableArea.minX) + availableArea.minX,
        y: Math.random() * (availableArea.maxY - availableArea.minY) + availableArea.minY
      };
    });

    return positions;
  }

  // Calculate distances between all cities
  calculateDistances(cityIds, positions) {
    const distances = {};
    
    for (let i = 0; i < cityIds.length; i++) {
      for (let j = 0; j < cityIds.length; j++) {
        if (i !== j) {
          const cityA = cityIds[i];
          const cityB = cityIds[j];
          const dx = positions[cityA].x - positions[cityB].x;
          const dy = positions[cityA].y - positions[cityB].y;
          const distance = Math.round(Math.sqrt(dx * dx + dy * dy) / 10);
          
          // Ensure minimum distance for better visualization
          const minDistance = 5;
          distances[`${cityA}-${cityB}`] = Math.max(minDistance, distance);
        }
      }
    }
    
    return distances;
  }

  // Generate a complete map configuration
  generateMap(numCities) {
    const cityIds = this.generateCityIds(numCities);
    const positions = this.generatePositions(cityIds);
    const distances = this.calculateDistances(cityIds, positions);
    
    return {
      ids: cityIds,
      positions: positions,
      distances: distances
    };
  }

  // Get the default map
  getDefaultMap() {
    return this.defaultCities;
  }

  // Create SVG elements for the map
  createMapSvg(map) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${this.svgWidth} ${this.svgHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // First create all road/edge elements
    for (let i = 0; i < map.ids.length; i++) {
      for (let j = i + 1; j < map.ids.length; j++) {
        const cityA = map.ids[i];
        const cityB = map.ids[j];
        const posA = map.positions[cityA];
        const posB = map.positions[cityB];
        const distance = map.distances[`${cityA}-${cityB}`];
        
        // Create edge group
        const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        edgeGroup.setAttribute('class', 'edge');
        edgeGroup.setAttribute('data-from', cityA);
        edgeGroup.setAttribute('data-to', cityB);
        edgeGroup.setAttribute('data-distance', distance);
        
        // Create road line
        const roadLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        roadLine.setAttribute('class', 'road');
        roadLine.setAttribute('x1', posA.x);
        roadLine.setAttribute('y1', posA.y);
        roadLine.setAttribute('x2', posB.x);
        roadLine.setAttribute('y2', posB.y);
        
        edgeGroup.appendChild(roadLine);
        svg.appendChild(edgeGroup);
      }
    }
    
    // Then create city elements on top
    map.ids.forEach(cityId => {
      const pos = map.positions[cityId];
      
      // Create city circle
      const cityCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      cityCircle.setAttribute('id', cityId);
      cityCircle.setAttribute('class', 'city');
      cityCircle.setAttribute('cx', pos.x);
      cityCircle.setAttribute('cy', pos.y);
      cityCircle.setAttribute('r', '8');
      
      // Create city label
      const cityLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cityLabel.setAttribute('class', 'city-label');
      cityLabel.setAttribute('x', pos.x);
      cityLabel.setAttribute('y', pos.y);
      cityLabel.textContent = cityId;
      
      svg.appendChild(cityCircle);
      svg.appendChild(cityLabel);
    });
    
    return svg;
  }

  // Replace the existing map with a new one
  replaceMap(map) {
    const mapContainer = document.getElementById('map-container');
    const oldSvg = mapContainer.querySelector('svg');
    
    // Create the new SVG map
    const newSvg = this.createMapSvg(map);
    
    // Replace the old SVG with the new one
    mapContainer.replaceChild(newSvg, oldSvg);
    
    // Set up the hover effects for the new roads
    this.setupEdgeHoverEffects();
  }

  // Set up hover effects for road edges
  setupEdgeHoverEffects() {
    document.querySelectorAll('.edge').forEach(edge => {
      const line = edge.querySelector('.road');
      edge.addEventListener('mouseenter', () => {
        line.classList.add('highlighted');
        const from = edge.getAttribute('data-from');
        const to = edge.getAttribute('data-to');
        const dist = edge.getAttribute('data-distance');
        document.getElementById('distance-info').textContent = `${from} → ${to} Distance: ${dist}`;
      });
      edge.addEventListener('mouseleave', () => {
        line.classList.remove('highlighted');
        document.getElementById('distance-info').textContent = '';
      });
    });
  }
}
