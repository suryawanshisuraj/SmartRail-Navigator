# Navigation Engine

## Graph Model

Represent the station as a graph.

Node:

- id
- floor
- x
- y
- type
- name
- accessible

Edge:

- from
- to
- distance
- estimatedTime
- accessible
- blocked

## Example

Node A -> Node B
Distance = 20 meters
Time = 15 seconds

Node B -> Node C
Distance = 30 meters
Time = 25 seconds

## Algorithms

### A*

Use A* for normal route calculation.

Cost:

f(n) = g(n) + h(n)

Where:

g(n) = actual cost from start

h(n) = estimated cost to destination

f(n) = total estimated cost

### Dijkstra

Use Dijkstra when a reliable heuristic is unavailable
or when comparing all possible routes.

## Route Modes

NORMAL

Use all available paths.

FASTEST

Minimize estimated travel time.

SHORTEST

Minimize distance.

ACCESSIBLE

Exclude:

- stairs
- blocked paths
- inaccessible routes

Prefer:

- lifts
- ramps
- accessible corridors

EMERGENCY

Prioritize safe and available emergency routes.

## Dynamic Obstacles

If a path becomes blocked:

blocked = true

Navigation engine must exclude that path.

## Route Output

Return:

- nodes
- distance
- estimated time
- instructions
- route type
- accessibility status
