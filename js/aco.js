/**
 * Ant Colony Optimization algorithm for TSP
 */
class ACO {
    constructor(cities, distances, options = {}) {
      this.cities = cities;
      this.distances = distances;
      this.numCities = cities.length;
      
      // Parameters
      this.alpha = options.alpha || 1; // Pheromone importance
      this.beta = options.beta || 2;   // Distance importance
      this.rho = options.rho || 0.5;   // Evaporation rate
      this.Q = options.Q || 100;       // Pheromone deposit factor
      this.numAnts = options.numAnts || Math.floor(this.numCities / 2);
      this.maxIterations = options.maxIterations || 10;
      this.iterationDelay = options.iterationDelay || 500; // Delay between iterations in ms
      this.bestPathReinforcement = options.bestPathReinforcement || false; // Enable best path reinforcement
      
      // Initialize pheromones
      this.pheromones = {};
      for (let i = 0; i < this.numCities; i++) {
        for (let j = 0; j < this.numCities; j++) {
          if (i !== j) {
            const key = this.getEdgeKey(this.cities[i], this.cities[j]);
            this.pheromones[key] = 0.1; // Initial pheromone value
          }
        }
      }
  
      this.bestRoute = null;
      this.bestDistance = Infinity;
      this.currentIteration = 0;
      this.ants = [];
      
      // Callbacks
      this.onAntMove = options.onAntMove || (() => {});
      this.onPheromoneUpdate = options.onPheromoneUpdate || (() => {});
      this.onIterationComplete = options.onIterationComplete || (() => {});
    }
  
    getEdgeKey(cityA, cityB) {
      // Create a consistent key for edge, regardless of direction
      return [cityA, cityB].sort().join('-');
    }
  
    async start() {
      this.currentIteration = 0;
      this.bestRoute = null;
      this.bestDistance = Infinity;
      
      while (this.currentIteration < this.maxIterations) {
        await this.runIteration();
        this.currentIteration++;
        
        // Update the best route if needed
        this.onIterationComplete(this.currentIteration, this.bestRoute, this.bestDistance);
        
        // Add a small delay to visualize iterations
        await new Promise(resolve => setTimeout(resolve, this.iterationDelay));
      }
      
      return {
        route: this.bestRoute,
        distance: this.bestDistance
      };
    }
  
    async runIteration() {
      // Create ants and position them
      this.ants = [];
      for (let i = 0; i < this.numAnts; i++) {
        const startCity = this.cities[Math.floor(Math.random() * this.numCities)];
        this.ants.push({
          id: i,
          currentCity: startCity,
          visitedCities: [startCity],
          totalDistance: 0
        });
      }
  
      // Move ants until all cities are visited
      for (let stepCount = 1; stepCount < this.numCities; stepCount++) {
        for (const ant of this.ants) {
          const nextCity = await this.chooseNextCity(ant);
          if (nextCity) {
            const distance = this.distances[this.getEdgeKey(ant.currentCity, nextCity)];
            ant.totalDistance += distance;
            
            // Animate ant movement
            await this.onAntMove(ant.id, ant.currentCity, nextCity, distance);
            
            ant.currentCity = nextCity;
            ant.visitedCities.push(nextCity);
          }
        }
      }
      
      // Complete the tours by returning to start
      for (const ant of this.ants) {
        const startCity = ant.visitedCities[0];
        const distance = this.distances[this.getEdgeKey(ant.currentCity, startCity)];
        ant.totalDistance += distance;
        
        // Animate final return movement
        await this.onAntMove(ant.id, ant.currentCity, startCity, distance);
        
        ant.visitedCities.push(startCity);
      }
      
      // Update pheromones
      await this.updatePheromones();
      
      // Update best route
      for (const ant of this.ants) {
        if (ant.totalDistance < this.bestDistance) {
          this.bestDistance = ant.totalDistance;
          this.bestRoute = [...ant.visitedCities];
        }
      }
    }
  
    async chooseNextCity(ant) {
      const unvisitedCities = this.cities.filter(city => !ant.visitedCities.includes(city));
      
      if (unvisitedCities.length === 0) {
        return null;
      }
      
      // Calculate probabilities for each unvisited city
      const probabilities = [];
      let totalProbability = 0;
      
      for (const city of unvisitedCities) {
        const edge = this.getEdgeKey(ant.currentCity, city);
        const pheromone = Math.pow(this.pheromones[edge], this.alpha);
        const distance = this.distances[edge];
        const visibility = Math.pow(1 / distance, this.beta);
        const probability = pheromone * visibility;
        
        probabilities.push({
          city,
          probability
        });
        
        totalProbability += probability;
      }
      
      // Normalize probabilities
      for (const item of probabilities) {
        item.probability /= totalProbability;
      }
      
      // Select next city using roulette wheel selection
      const random = Math.random();
      let cumulativeProbability = 0;
      
      for (const item of probabilities) {
        cumulativeProbability += item.probability;
        if (random <= cumulativeProbability) {
          return item.city;
        }
      }
      
      // Fallback to first city if roulette fails
      return unvisitedCities[0];
    }
  
    async updatePheromones() {
      // Evaporation
      for (const edge in this.pheromones) {
        this.pheromones[edge] *= (1 - this.rho);
      }
      
      // Find best ant in current iteration
      let bestAnt = null;
      let bestAntDistance = Infinity;
      
      for (const ant of this.ants) {
        if (ant.totalDistance < bestAntDistance) {
          bestAntDistance = ant.totalDistance;
          bestAnt = ant;
        }
      }
      
      // Deposit
      for (const ant of this.ants) {
        const contribution = this.Q / ant.totalDistance;
        
        for (let i = 0; i < ant.visitedCities.length - 1; i++) {
          const cityA = ant.visitedCities[i];
          const cityB = ant.visitedCities[i + 1];
          const edge = this.getEdgeKey(cityA, cityB);
          
          this.pheromones[edge] += contribution;
          
          // Best path reinforcement - extra pheromone for the best ant if enabled
          if (this.bestPathReinforcement && ant === bestAnt) {
            this.pheromones[edge] += contribution * 2; // Double pheromone for best ant
          }
          
          // Notify about pheromone update for visualization
          await this.onPheromoneUpdate(edge, this.pheromones[edge]);
        }
      }
      
      // Global best path reinforcement (always apply to the all-time best path)
      if (this.bestPathReinforcement && this.bestRoute) {
        const bestPathContribution = this.Q / this.bestDistance * 1.5; // 50% more than normal
        
        for (let i = 0; i < this.bestRoute.length - 1; i++) {
          const cityA = this.bestRoute[i];
          const cityB = this.bestRoute[i + 1];
          const edge = this.getEdgeKey(cityA, cityB);
          
          this.pheromones[edge] += bestPathContribution;
          
          // Notify about pheromone update for visualization
          await this.onPheromoneUpdate(edge, this.pheromones[edge]);
        }
      }
    }
  
    setAlpha(alpha) {
      this.alpha = alpha;
    }
  
    setBeta(beta) {
      this.beta = beta;
    }
    
    setIterationDelay(delay) {
      this.iterationDelay = delay;
    }
    
    setMaxIterations(maxIterations) {
      this.maxIterations = maxIterations;
    }
    
    setNumAnts(numAnts) {
      this.numAnts = numAnts;
    }
    
    setEvaporationRate(rate) {
      this.rho = rate;
    }
    
    setPheromoneConstant(constant) {
      this.Q = constant;
    }
    
    setBestPathReinforcement(enabled) {
      this.bestPathReinforcement = enabled;
    }
  }