/**
 * SmartRail Navigator - Navigation Engine
 * Implements A* and Dijkstra pathfinding for indoor railway station graphs.
 * Adheres strictly to NAVIGATION_ENGINE.md specifications.
 */

export class StationGraph {
  constructor(nodes = [], edges = []) {
    this.nodes = new Map();
    this.adjacencyList = new Map();

    nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
    });

    edges.forEach(edge => {
      this.addEdge(edge);
    });
  }

  addEdge(edge) {
    if (!this.adjacencyList.has(edge.from_node_id)) {
      this.adjacencyList.set(edge.from_node_id, []);
    }
    this.adjacencyList.get(edge.from_node_id).push(edge);
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getOutgoingEdges(nodeId) {
    return this.adjacencyList.get(nodeId) || [];
  }
}

/**
 * Min-Priority Queue for A*
 */
class MinPriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(item, priority) {
    this.queue.push({ item, priority });
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.queue.shift()?.item;
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

/**
 * Euclidean distance heuristic for A* pathfinding.
 * Includes vertical penalty if nodes are on different floors.
 */
function heuristic(nodeA, nodeB) {
  if (!nodeA || !nodeB) return 0;
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  const horizontalDist = Math.sqrt(dx * dx + dy * dy);
  const floorDiff = Math.abs((nodeA.floor_id || 1) - (nodeB.floor_id || 1));
  const floorPenalty = floorDiff * 60; // 60-meter equivalent penalty for vertical level change
  return horizontalDist + floorPenalty;
}

/**
 * Calculate A* indoor route between startNodeId and destinationNodeId.
 * Route modes: 'NORMAL' | 'FASTEST' | 'SHORTEST' | 'ACCESSIBLE' | 'EMERGENCY'
 */
export function calculateAStarRoute(graph, startNodeId, destinationNodeId, routeType = 'NORMAL') {
  if (!graph || typeof graph.getNode !== 'function') {
    return {
      success: false,
      error: 'A valid station graph is required for pathfinding.'
    };
  }
  if (!startNodeId || !destinationNodeId) {
    return {
      success: false,
      error: 'Both startNodeId and destinationNodeId must be provided.'
    };
  }

  if (startNodeId === destinationNodeId) {
    const node = graph.getNode(startNodeId);
    return {
      success: true,
      distance: 0,
      estimatedTime: 0,
      route: [node],
      instructions: ['You are already at your destination.'],
      routeType,
      accessibilityStatus: true
    };
  }

  const startNode = graph.getNode(startNodeId);
  const destNode = graph.getNode(destinationNodeId);

  if (!startNode || !destNode) {
    return {
      success: false,
      error: 'Invalid start or destination waypoint specified.'
    };
  }

  const openSet = new MinPriorityQueue();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  graph.getAllNodes().forEach(node => {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  });

  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, heuristic(startNode, destNode));
  openSet.enqueue(startNodeId, fScore.get(startNodeId));

  const visited = new Set();

  while (!openSet.isEmpty()) {
    const currentId = openSet.dequeue();

    if (currentId === destinationNodeId) {
      return reconstructAStarPath(cameFrom, currentId, graph, routeType);
    }

    visited.add(currentId);
    const currentNode = graph.getNode(currentId);

    for (const edge of graph.getOutgoingEdges(currentId)) {
      // Dynamic obstacles: ignore blocked paths
      if (edge.blocked) {
        continue;
      }

      // Accessible mode: strictly exclude stairs and non-accessible paths
      if (routeType === 'ACCESSIBLE' && (!edge.accessible || !graph.getNode(edge.to_node_id)?.accessible)) {
        continue;
      }

      // Cost calculation based on route mode
      let edgeCost = edge.distance;
      if (routeType === 'FASTEST') {
        edgeCost = edge.estimated_time;
      }

      // Lifts preferred in accessible mode
      const neighborNode = graph.getNode(edge.to_node_id);
      if (routeType === 'ACCESSIBLE' && neighborNode?.type === 'LIFT') {
        edgeCost *= 0.7; // Incentive to use lift over ramps/corridors
      }

      const tentativeGScore = gScore.get(currentId) + edgeCost;

      if (tentativeGScore < gScore.get(edge.to_node_id)) {
        cameFrom.set(edge.to_node_id, { from: currentId, edge });
        gScore.set(edge.to_node_id, tentativeGScore);
        const h = heuristic(neighborNode, destNode);
        fScore.set(edge.to_node_id, tentativeGScore + h);

        if (!visited.has(edge.to_node_id)) {
          openSet.enqueue(edge.to_node_id, fScore.get(edge.to_node_id));
        }
      }
    }
  }

  return {
    success: false,
    error: 'No available route found. Path may be blocked or inaccessible.'
  };
}

/**
 * Reconstruct route path, compute total distance, time, and generate turn-by-turn guidance.
 */
function reconstructAStarPath(cameFrom, currentId, graph, routeType) {
  const pathNodes = [];
  const edges = [];
  let curr = currentId;

  while (cameFrom.has(curr)) {
    const step = cameFrom.get(curr);
    pathNodes.unshift(graph.getNode(curr));
    edges.unshift(step.edge);
    curr = step.from;
  }
  pathNodes.unshift(graph.getNode(curr)); // start node

  let totalDistance = 0;
  let totalTime = 0;
  edges.forEach(e => {
    totalDistance += e.distance;
    totalTime += e.estimated_time;
  });

  // Generate step-by-step turn-by-turn instructions & maneuvers
  const instructions = generateTurnByTurnInstructions(pathNodes, edges, routeType);
  const maneuvers = generateManeuvers(pathNodes, edges, routeType);

  return {
    success: true,
    distance: totalDistance,
    estimatedTime: totalTime,
    route: pathNodes,
    instructions,
    maneuvers,
    routeType,
    accessibilityStatus: routeType === 'ACCESSIBLE' ? true : pathNodes.every(n => n.accessible)
  };
}

/**
 * Calculate geographical bearing in degrees between two GPS points.
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) return 0;
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaLambda = (lng2 - lng1) * rad;
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return ((theta * 180 / Math.PI) + 360) % 360;
}

/**
 * Convert azimuth angle to 8-point cardinal direction.
 */
export function bearingToCardinal(deg) {
  const directions = ['North (N)', 'North-East (NE)', 'East (E)', 'South-East (SE)', 'South (S)', 'South-West (SW)', 'West (W)', 'North-West (NW)'];
  const index = Math.round(((deg % 360) / 45)) % 8;
  return directions[index];
}

/**
 * Generate structured Google Maps style navigation maneuvers with turn angles and bearings.
 */
function generateManeuvers(nodes, edges, routeType) {
  if (nodes.length <= 1) {
    return [{
      stepIndex: 1,
      instruction: 'You have arrived at your destination.',
      type: 'ARRIVE',
      icon: '📍',
      distance: 0,
      estimatedTime: 0,
      bearing: 0,
      cardinal: 'North (N)',
      fromNode: nodes[0],
      toNode: nodes[0]
    }];
  }

  const maneuvers = [];

  for (let i = 0; i < edges.length; i++) {
    const fromNode = nodes[i];
    const toNode = nodes[i + 1];
    const edge = edges[i];

    const rawBearing = calculateBearing(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);
    const bearing = Math.round(rawBearing);
    const cardinal = bearingToCardinal(bearing);

    let type = 'STRAIGHT';
    let icon = '⬆️';
    let turnDescription = `Head ${cardinal} for ${edge.distance}m toward ${toNode.name}`;

    if (toNode.type === 'LIFT') {
      type = 'LIFT';
      icon = '🛗';
      turnDescription = `Take ${toNode.name} to change levels (${edge.distance}m)`;
    } else if (toNode.type === 'STAIRS') {
      type = 'STAIRS';
      icon = '🪜';
      turnDescription = `Take stairs via ${toNode.name} (${edge.distance}m)`;
    } else if (toNode.type === 'PLATFORM') {
      type = 'PLATFORM';
      icon = '🚆';
      turnDescription = `Boarding Deck: ${toNode.name} (${edge.distance}m ahead)`;
    } else if (i > 0) {
      const prevNode = nodes[i - 1];
      const prevBearing = Math.round(calculateBearing(prevNode.lat, prevNode.lng, fromNode.lat, fromNode.lng));
      let diff = bearing - prevBearing;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;

      if (diff > 35 && diff < 145) {
        type = 'TURN_RIGHT';
        icon = '↗️';
        turnDescription = `Turn right onto ${toNode.name} (${edge.distance}m)`;
      } else if (diff < -35 && diff > -145) {
        type = 'TURN_LEFT';
        icon = '↖️';
        turnDescription = `Turn left onto ${toNode.name} (${edge.distance}m)`;
      } else if (diff >= 145 || diff <= -145) {
        type = 'U_TURN';
        icon = '↩️';
        turnDescription = `Turn around toward ${toNode.name} (${edge.distance}m)`;
      }
    }

    maneuvers.push({
      stepIndex: i + 1,
      instruction: turnDescription,
      type,
      icon,
      distance: edge.distance,
      estimatedTime: edge.estimated_time,
      bearing,
      cardinal,
      fromNode,
      toNode
    });
  }

  // Final destination arrival maneuver
  maneuvers.push({
    stepIndex: maneuvers.length + 1,
    instruction: `Destination reached: ${nodes[nodes.length - 1].name}.`,
    type: 'ARRIVE',
    icon: '🏁',
    distance: 0,
    estimatedTime: 0,
    bearing: maneuvers[maneuvers.length - 1]?.bearing || 0,
    fromNode: nodes[nodes.length - 1],
    toNode: nodes[nodes.length - 1]
  });

  return maneuvers;
}

/**
 * Generate clear human and voice navigation instructions.
 */
function generateTurnByTurnInstructions(nodes, edges, routeType) {
  if (nodes.length <= 1) return ['You have arrived at your destination.'];

  const steps = [];
  steps.push(`Start from ${nodes[0].name}.`);

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const target = nodes[i + 1];

    if (target.type === 'LIFT') {
      steps.push(`Take ${target.name} (${edge.distance}m, ~${edge.estimated_time}s).`);
    } else if (target.type === 'ESCALATOR') {
      steps.push(`Use ${target.name} to change levels.`);
    } else if (target.type === 'STAIRS') {
      steps.push(`Walk down/up via ${target.name}.`);
    } else if (i === edges.length - 1) {
      steps.push(`Arrive at ${target.name} on your path (${edge.distance}m ahead).`);
    } else {
      steps.push(`Walk ${edge.distance} meters toward ${target.name}.`);
    }
  }

  steps.push(`Destination reached: ${nodes[nodes.length - 1].name}.`);
  return steps;
}
