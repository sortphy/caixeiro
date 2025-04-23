document.addEventListener('DOMContentLoaded', function() {
    // Default parameters
    let alpha = 1;
    let beta = 2;
    let delayMs = 300; // Default animation delay
    let maxIterations = 10; // Default iterations
    let numAnts = 2; // Will be updated based on city count
    let evaporationRate = 0.5; // Default evaporation rate
    let pheromoneConstant = 100; // Default pheromone deposit factor
    let bestPathReinforcement = false; // Default best path reinforcement
    let isFullSpeed = false; // Full speed mode flag
    let isRunning = false;
    let simulation = null;
    let currentBestRoute = null;
  
    // References to UI elements
    const simulateBtn = document.getElementById('simulateBtn');
    const statusElement = document.getElementById('status');
    const iterationElement = document.getElementById('iteration');
    const bestDistanceElement = document.getElementById('best-distance');
    const alphaSlider = document.getElementById('alpha-slider');
    const betaSlider = document.getElementById('beta-slider');
    const delaySlider = document.getElementById('delay-slider');
    const iterationsSlider = document.getElementById('iterations-slider');
    const antsSlider = document.getElementById('ants-slider');
    const evaporationSlider = document.getElementById('evaporation-slider');
    const pheromoneSlider = document.getElementById('pheromone-slider');
    const bestPathToggle = document.getElementById('best-path-toggle');
    const fullSpeedToggle = document.getElementById('full-speed-toggle');
    const alphaValue = document.getElementById('alpha-value');
    const betaValue = document.getElementById('beta-value');
    const delayValue = document.getElementById('delay-value');
    const iterationsValue = document.getElementById('iterations-value');
    const antsValue = document.getElementById('ants-value');
    const evaporationValue = document.getElementById('evaporation-value');
    const pheromoneValue = document.getElementById('pheromone-value');
    const resetBtn = document.getElementById('resetBtn');
    const statusContainer = document.getElementById('status-container');
    
    // City generator UI elements
    const cityCountInput = document.getElementById('city-count');
    const generateMapBtn = document.getElementById('generate-map-btn');
    const genWarningElement = document.getElementById('gen-warning');
    
    // Initialize city generator
    const cityGenerator = new CityGenerator();
    
    // Current map data
    let currentMap = cityGenerator.getDefaultMap();
    let cityIds = currentMap.ids;
    let distances = currentMap.distances;
    
    // Set initial ants count based on number of cities
    numAnts = Math.floor(cityIds.length / 2);
    if (antsSlider) {
      antsSlider.value = numAnts;
      antsValue.textContent = numAnts;
    }
    
    // Initialize other sliders with default values
    if (iterationsSlider) {
      iterationsSlider.value = maxIterations;
      iterationsValue.textContent = maxIterations;
    }
    
    if (evaporationSlider) {
      evaporationSlider.value = evaporationRate;
      evaporationValue.textContent = evaporationRate;
    }
    
    if (pheromoneSlider) {
      pheromoneSlider.value = pheromoneConstant;
      pheromoneValue.textContent = pheromoneConstant;
    }
    
    if (bestPathToggle) {
      bestPathToggle.checked = bestPathReinforcement;
    }
    
    // Update slider value displays
    function updateSliderValues() {
      alphaValue.textContent = alphaSlider.value;
      alpha = parseFloat(alphaSlider.value);
      
      betaValue.textContent = betaSlider.value;
      beta = parseFloat(betaSlider.value);
      
      delayValue.textContent = `${delaySlider.value}ms`;
      delayMs = parseInt(delaySlider.value, 10);
      
      iterationsValue.textContent = iterationsSlider.value;
      maxIterations = parseInt(iterationsSlider.value, 10);
      
      antsValue.textContent = antsSlider.value;
      numAnts = parseInt(antsSlider.value, 10);
      
      evaporationValue.textContent = evaporationSlider.value;
      evaporationRate = parseFloat(evaporationSlider.value);
      
      pheromoneValue.textContent = pheromoneSlider.value;
      pheromoneConstant = parseInt(pheromoneSlider.value, 10);
      
      bestPathReinforcement = bestPathToggle.checked;
    }
  
    // Handle ant movement - animation
    async function handleAntMove(antId, fromCity, toCity, distance) {
      // Create ant if it doesn't exist
      let antElement = document.getElementById(`ant-${antId}`);
      if (!antElement) {
        antElement = UI.createAnt(antId);
      }
      
      // Get positions and move
      const startPos = UI.getCityPosition(fromCity);
      const endPos = UI.getCityPosition(toCity);
      
      // Make ant visible if it's newly created
      antElement.setAttribute('cx', startPos.x);
      antElement.setAttribute('cy', startPos.y);
      
      // Animate movement with current delay setting
      await UI.moveAnt(antElement, startPos, endPos, delayMs);
      
      // Highlight the path temporarily
      const edge = UI.findEdgeElement(fromCity, toCity);
      if (edge) {
        const roadElement = edge.querySelector('.road');
        roadElement.classList.add('ant-traveled');
        setTimeout(() => {
          roadElement.classList.remove('ant-traveled');
        }, delayMs / 3);
      }
    }
  
    // Handle pheromone update - visualization
    async function handlePheromoneUpdate(edgeKey, level) {
      const [cityA, cityB] = edgeKey.split('-');
      const edge = UI.findEdgeElement(cityA, cityB);
      
      if (edge) {
        UI.updateEdgeStyle(edge, level);
      }
      
      // Small delay to visualize updates
      await new Promise(resolve => setTimeout(resolve, Math.min(10, delayMs / 30)));
    }
  
    // Update the display of the best route found so far
    function updateBestPathDisplay(bestRoute) {
      // First, remove previous best path highlighting
      if (currentBestRoute) {
        for (let i = 0; i < currentBestRoute.length - 1; i++) {
          const cityA = currentBestRoute[i];
          const cityB = currentBestRoute[i + 1];
          const edge = UI.findEdgeElement(cityA, cityB);
          
          if (edge) {
            const roadElement = edge.querySelector('.road');
            roadElement.classList.remove('best-path');
          }
        }
      }
      
      // Set and highlight the new best path
      currentBestRoute = bestRoute;
      
      if (currentBestRoute) {
        // Store references to all best path edges for highlighting
        window.bestPathEdges = [];
        
        for (let i = 0; i < currentBestRoute.length - 1; i++) {
          const cityA = currentBestRoute[i];
          const cityB = currentBestRoute[i + 1];
          const edge = UI.findEdgeElement(cityA, cityB);
          
          if (edge) {
            const roadElement = edge.querySelector('.road');
            roadElement.classList.add('best-path');
            window.bestPathEdges.push(roadElement);
          }
        }
      }
    }
  
    // Best path highlight effect
    function setupBestPathHighlight() {
      if (statusContainer) {
        statusContainer.addEventListener('mouseenter', function() {
          // Remove any existing hover effects first
          document.querySelectorAll('.road').forEach(path => {
            path.classList.remove('road-hovered', 'road-dimmed');
          });
          
          // Check if we have the best path edges stored
          if (window.bestPathEdges && window.bestPathEdges.length > 0) {
            // Highlight best path edges directly from our stored array
            window.bestPathEdges.forEach(path => {
              path.classList.add('highlight-best-path');
            });
            
            // Dim other paths
            document.querySelectorAll('.road').forEach(path => {
              if (!window.bestPathEdges.includes(path)) {
                path.classList.add('dim-other-paths');
              }
            });
          } else {
            // Fallback to the old method if for some reason we don't have stored edges
            document.querySelectorAll('.road.best-path').forEach(path => {
              path.classList.add('highlight-best-path');
            });
            
            document.querySelectorAll('.road:not(.best-path)').forEach(path => {
              path.classList.add('dim-other-paths');
            });
          }
        });
        
        statusContainer.addEventListener('mouseleave', function() {
          // Remove highlighting from all roads
          document.querySelectorAll('.road').forEach(path => {
            path.classList.remove('highlight-best-path');
            path.classList.remove('dim-other-paths');
          });
        });
      }
    }

    // Set up the highlight effect
    setupBestPathHighlight();
  
    // Handle iteration complete
    function handleIterationComplete(iteration, bestRoute, bestDistance) {
      if (iterationElement) {
        iterationElement.textContent = iteration;
      }
      
      if (bestDistanceElement && bestDistance !== Infinity) {
        bestDistanceElement.textContent = bestDistance.toFixed(2);
      }
      
      // Show best route so far
      if (bestRoute) {
        console.log('Melhor rota:', bestRoute.join(' → '));
        if (statusElement) {
          statusElement.textContent = `Melhor rota: ${bestRoute.join(' → ')}`;
        }
        
        // Update best path visual
        updateBestPathDisplay(bestRoute);
        
        // Refresh the highlight effect setup
        setupBestPathHighlight();
      }
    }
  
    // Run simulation
    async function runSimulation() {
      if (isRunning) return;
      
      isRunning = true;
      simulateBtn.disabled = true;
      simulateBtn.textContent = 'Executando...';
      
      if (statusElement) {
        statusElement.textContent = isFullSpeed ? 
          'Simulando em velocidade máxima... (aguarde alguns instantes)' : 
          'Iniciando simulação...';
      }
      
      // Force UI update before proceeding, especially important for full speed mode
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Reset UI
      UI.resetEdges();
      currentBestRoute = null;
      
      // Remove any existing ants
      for (let i = 0; i < numAnts; i++) {
        UI.removeAnt(i);
      }
      
      // Create ACO instance
      simulation = new ACO(cityIds, distances, {
        alpha,
        beta,
        rho: evaporationRate,
        Q: pheromoneConstant,
        numAnts: numAnts,
        maxIterations: maxIterations,
        bestPathReinforcement: bestPathReinforcement,
        isFullSpeed: isFullSpeed,
        onAntMove: handleAntMove,
        onPheromoneUpdate: handlePheromoneUpdate,
        onIterationComplete: handleIterationComplete,
        iterationDelay: delayMs * 1.5 // Use a slightly longer delay between iterations
      });
      
      try {
        // Run the algorithm
        const result = await simulation.start();
        
        // Show final result
        if (statusElement) {
          statusElement.textContent = `Simulação concluída! Melhor rota: ${result.route.join(' → ')}`;
        }
        
        // Final best path is already highlighted by the handleIterationComplete
      } catch (error) {
        console.error('Erro na simulação:', error);
        if (statusElement) {
          statusElement.textContent = 'Erro ao executar a simulação';
        }
      } finally {
        isRunning = false;
        simulateBtn.disabled = false;
        simulateBtn.textContent = 'Simular';
      }
    }
  
    // Reset the visualization
    function resetVisualization() {
      UI.resetEdges();
      document.querySelectorAll('.road').forEach(road => {
        road.classList.remove('best-path', 'ant-traveled', 'road-hovered', 'road-dimmed');
      });
      
      for (let i = 0; i < numAnts; i++) {
        UI.removeAnt(i);
      }
      
      currentBestRoute = null;
      
      if (statusElement) {
        statusElement.textContent = 'Simulação reiniciada. Pronto para simular.';
      }
      
      if (iterationElement) {
        iterationElement.textContent = '0';
      }
      
      if (bestDistanceElement) {
        bestDistanceElement.textContent = '-';
      }
    }
    
    // Generate a new random map
    function generateNewMap() {
      const cityCount = parseInt(cityCountInput.value);
      
      if (cityCount < 4 || cityCount > 100) {
        genWarningElement.textContent = 'O número de cidades deve estar entre 4 e 100!';
        return;
      }
      
      genWarningElement.textContent = '';
      
      // Reset any simulation
      resetVisualization();
      
      // Generate new map
      currentMap = cityGenerator.generateMap(cityCount);
      cityIds = currentMap.ids;
      distances = currentMap.distances;
      
      // Update the map visualization
      cityGenerator.replaceMap(currentMap);
      
      // Update ant count based on new city count
      numAnts = Math.floor(cityIds.length / 2);
      if (antsSlider) {
        antsSlider.value = numAnts;
        antsValue.textContent = numAnts;
      }
      
      if (statusElement) {
        statusElement.textContent = `Mapa gerado com ${cityCount} cidades. Pronto para simular.`;
      }
    }
  
    // Event listeners
    if (alphaSlider) {
      alphaSlider.addEventListener('input', function() {
        updateSliderValues();
        if (simulation) {
          simulation.setAlpha(alpha);
        }
      });
    }
    
    if (betaSlider) {
      betaSlider.addEventListener('input', function() {
        updateSliderValues();
        if (simulation) {
          simulation.setBeta(beta);
        }
      });
    }
    
    if (delaySlider) {
      delaySlider.addEventListener('input', function() {
        updateSliderValues();
        if (simulation) {
          simulation.setIterationDelay(delayMs);
        }
      });
    }
    
    if (iterationsSlider) {
      iterationsSlider.addEventListener('input', function() {
        updateSliderValues();
        if (simulation) {
          simulation.setMaxIterations(maxIterations);
        }
      });
    }
    
    if (antsSlider) {
      antsSlider.addEventListener('input', function() {
        updateSliderValues();
        if (simulation) {
          simulation.setNumAnts(numAnts);
        }
      });
    }
    
    if (evaporationSlider) {
      evaporationSlider.addEventListener('input', function() {
        updateSliderValues();
        if (simulation) {
          simulation.setEvaporationRate(evaporationRate);
        }
      });
    }
    
    if (pheromoneSlider) {
      pheromoneSlider.addEventListener('input', function() {
        updateSliderValues();
        if (simulation) {
          simulation.setPheromoneConstant(pheromoneConstant);
        }
      });
    }
    
    if (bestPathToggle) {
      bestPathToggle.addEventListener('change', function() {
        updateSliderValues();
        if (simulation) {
          simulation.setBestPathReinforcement(bestPathReinforcement);
        }
      });
    }
    
    if (fullSpeedToggle) {
      fullSpeedToggle.addEventListener('change', function() {
        isFullSpeed = fullSpeedToggle.checked;
        if (simulation) {
          simulation.setFullSpeed(isFullSpeed);
        }
      });
    }
    
    // Set up buttons
    if (simulateBtn) {
      simulateBtn.addEventListener('click', runSimulation);
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', resetVisualization);
    }
    
    if (generateMapBtn) {
      generateMapBtn.addEventListener('click', generateNewMap);
    }
    
    // City count input validation
    if (cityCountInput) {
      cityCountInput.addEventListener('input', function() {
        const cityCount = parseInt(this.value);
        
        if (cityCount > 20) {
          genWarningElement.textContent = 'Aviso: Muitas cidades podem prejudicar o desempenho e a visualização!';
        } else {
          genWarningElement.textContent = '';
        }
      });
    }
    
    // Initial setup
    updateSliderValues();

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check for saved theme preference, otherwise use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      htmlElement.setAttribute('data-theme', savedTheme);
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      htmlElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    }

    // Toggle theme
    themeToggle.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
});