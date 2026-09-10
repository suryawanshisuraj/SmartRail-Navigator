# Passenger User Flows & Interaction Workflows - SmartRail-Navigator

This document details the critical user journeys, state transitions, and step-by-step decision trees for passengers using SmartRail-Navigator.

---

## 1. High-Level Passenger Experience Flow

```mermaid
flowchart TD
    Start([Passenger Opens App]) --> SearchRoute[1. Route Planning & Search]
    SearchRoute --> SelectPreferences{Wheelchair / Step-Free Needed?}
    SelectPreferences -- Yes --> FilterAccessible[Apply Accessible Dijkstra Filter]
    SelectPreferences -- No --> StandardRoute[Compute Fastest / Least Transfers]

    FilterAccessible --> DisplayItinerary[Display Recommended Itineraries]
    StandardRoute --> DisplayItinerary

    DisplayItinerary --> ChooseJourney[Select Specific Train Leg]
    ChooseJourney --> StationArrival[2. Station Arrival & Concourse Navigation]

    StationArrival --> ViewStationMap[Open Indoor Station Vector Map]
    ViewStationMap --> Wayfinding[Path to Ticket Gate -> Elevator -> Platform]

    Wayfinding --> PlatformBoarding[3. Platform Waiting & Boarding]
    PlatformBoarding --> LiveTrack[4. Live Telemetry & In-Transit Tracking]

    LiveTrack --> DisruptionCheck{Service Disruption / Delay?}
    DisruptionCheck -- Yes --> RealTimeAlert[Push Live Platform/Delay Alert + AI Re-routing]
    DisruptionCheck -- No --> ApproachStation[Approach Destination Station]

    RealTimeAlert --> ApproachStation
    ApproachStation --> Alight[Alight Train -> Exit Navigation]
    Alight --> Completed([Journey Completed])
```

---

## 2. Step-by-Step User Journey Scenarios

### Scenario A: Rush-Hour Commuter
1. **Search**: Opens application $\rightarrow$ System auto-detects nearest station ("Central Grand Terminal").
2. **Preference**: Commuter selects "Least Transfers" preference.
3. **Selection**: Picks the 08:15 AM Gold Express service.
4. **Live Alert**: At 08:10 AM, WebSocket alert sounds: "Train 101 reassigned to Platform 4B due to switch congestion on Track 2".
5. **Action**: Commuter looks at the animated station indicator pointing directly to the stairs/escalator to Platform 4B.

### Scenario B: Wheelchair Passenger Navigation
1. **Search**: Selects origin "Central Grand Terminal" and destination "River Junction".
2. **Filter**: Toggles on **"Step-Free Accessibility (Wheelchair/Stroller)"**.
3. **Itinerary**: Routing eliminates all paths with footbridges or stairwells; guarantees level boarding or conductor ramp assistance.
4. **Indoor Map**: Displays a highlighted green accessible path guiding from Entrance A $\rightarrow$ Wide Ticket Gate $\rightarrow$ Concourse Elevator EL-2 (Level -2) $\rightarrow$ Platform 4 Wheelchair Boarding Zone.
5. **AI Companion**: Passenger queries "Where is the nearest accessible restroom at River Junction?" AI Copilot responds with immediate location: "Ground Level Concourse, opposite Baggage Claim 1, equipped with automatic power door."

---

## 3. Passenger State Machine

```mermaid
stateDiagram-v2
    [*] --> IDLE : App Launch
    IDLE --> SEARCHING : Enter Origin & Destination
    SEARCHING --> ITINERARY_VIEW : Routes Found
    SEARCHING --> NO_ROUTES_FOUND : Error / Disconnected Stations
    NO_ROUTES_FOUND --> SEARCHING : Modify Query

    ITINERARY_VIEW --> STATION_WAYFINDING : Click 'Station Map'
    ITINERARY_VIEW --> TICKET_PURCHASE : Click 'Book / Fare Details'

    STATION_WAYFINDING --> LIVE_TRACKING : Train Departing Soon
    TICKET_PURCHASE --> LIVE_TRACKING : Pass Confirmed

    LIVE_TRACKING --> IN_TRANSIT : Train Departs Platform
    IN_TRANSIT --> REROUTING : Severe Disruption Encountered
    REROUTING --> IN_TRANSIT : New Alternate Accepted
    IN_TRANSIT --> ARRIVED : Destination Reached
    ARRIVED --> [*]
```
