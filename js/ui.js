document.addEventListener('DOMContentLoaded', function() {
  // Initial setup of edge hover effects
  setupEdgeHoverEffects();

  // Function to set up hover effects for all edges
  function setupEdgeHoverEffects() {
    document.querySelectorAll('.edge').forEach(edge => {
      const line = edge.querySelector('.road');
      
      // Remove any existing listeners to prevent duplicates
      edge.removeEventListener('mouseenter', handleEdgeMouseEnter);
      edge.removeEventListener('mouseleave', handleEdgeMouseLeave);
      
      // Add new listeners
      edge.addEventListener('mouseenter', handleEdgeMouseEnter);
      edge.addEventListener('mouseleave', handleEdgeMouseLeave);
    });
  }
  
  // Handle edge mouse enter
  function handleEdgeMouseEnter(event) {
    const edge = event.currentTarget;
    const line = edge.querySelector('.road');
    
    // Highlight current road
    line.classList.add('highlighted');
    line.classList.add('road-hovered');
    
    // Dim all other roads
    document.querySelectorAll('.road').forEach(road => {
      if (road !== line) {
        road.classList.add('road-dimmed');
      }
    });
    
    // Show distance info
    const from = edge.getAttribute('data-from');
    const to = edge.getAttribute('data-to');
    const dist = edge.getAttribute('data-distance');
    document.getElementById('distance-info').textContent = `${from} → ${to} Distance: ${dist}`;
  }
  
  // Handle edge mouse leave
  function handleEdgeMouseLeave(event) {
    const edge = event.currentTarget;
    const line = edge.querySelector('.road');
    
    // Remove highlighting from current road
    line.classList.remove('highlighted');
    line.classList.remove('road-hovered');
    
    // Restore all other roads
    document.querySelectorAll('.road').forEach(road => {
      road.classList.remove('road-dimmed');
    });
    
    // Clear distance info
    document.getElementById('distance-info').textContent = '';
  }

  // Create ant SVG element
  function createAnt(id) {
    const svg = document.querySelector('svg');
    const ant = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ant.setAttribute('id', `ant-${id}`);
    ant.setAttribute('r', '3');
    ant.setAttribute('fill', '#ffcc00');
    ant.setAttribute('stroke', '#333');
    ant.setAttribute('stroke-width', '0.5');
    svg.appendChild(ant);
    return ant;
  }

  // Remove an ant from the SVG
  function removeAnt(id) {
    const ant = document.getElementById(`ant-${id}`);
    if (ant) {
      ant.remove();
    }
  }

  // Get city position
  function getCityPosition(cityId) {
    const city = document.getElementById(cityId);
    return {
      x: parseFloat(city.getAttribute('cx')),
      y: parseFloat(city.getAttribute('cy'))
    };
  }

  // Move ant along path
  async function moveAnt(antElement, startPos, endPos, duration = 500) {
    return new Promise(resolve => {
      const startTime = performance.now();
      
      function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const x = startPos.x + (endPos.x - startPos.x) * progress;
        const y = startPos.y + (endPos.y - startPos.y) * progress;
        
        antElement.setAttribute('cx', x);
        antElement.setAttribute('cy', y);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      }
      
      requestAnimationFrame(animate);
    });
  }

  // Find edge element between two cities
  function findEdgeElement(cityA, cityB) {
    let edgeElement = null;
    document.querySelectorAll('.edge').forEach(edge => {
      const from = edge.getAttribute('data-from');
      const to = edge.getAttribute('data-to');
      if ((from === cityA && to === cityB) || (from === cityB && to === cityA)) {
        edgeElement = edge;
      }
    });
    return edgeElement;
  }

  // Update edge style based on pheromone level
  function updateEdgeStyle(edge, pheromoneLevel) {
    const roadElement = edge.querySelector('.road');
    const normalizedLevel = Math.min(pheromoneLevel / 5, 1); // Adjust max level as needed
    
    const h = 120 - normalizedLevel * 120; // Hue: 120 (green) to 0 (red)
    const s = 80; // Saturation
    const l = 40 + normalizedLevel * 20; // Lightness
    
    roadElement.style.stroke = `hsl(${h}, ${s}%, ${l}%)`;
    roadElement.style.strokeWidth = `${1 + normalizedLevel * 4}px`;
  }

  // Reset all edges to default style
  function resetEdges() {
    document.querySelectorAll('.road').forEach(road => {
      road.style.stroke = '';
      road.style.strokeWidth = '';
      road.classList.remove('road-hovered', 'road-dimmed', 'highlighted');
    });
  }

  // Expose UI functions to the global scope for use by main.js
  window.UI = {
    createAnt,
    removeAnt,
    getCityPosition,
    moveAnt,
    findEdgeElement,
    updateEdgeStyle,
    resetEdges,
    setupEdgeHoverEffects
  };
}); 