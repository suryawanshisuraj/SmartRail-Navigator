# Real-Time System

Use WebSocket/Socket.IO.

## Events

platform_changed

lift_status_changed

escalator_status_changed

path_blocked

path_unblocked

crowd_updated

station_announcement

## Example

{
  "type": "lift_status_changed",
  "locationId": "LIFT_01",
  "status": "maintenance"
}

Navigation engine must immediately avoid unavailable routes.

## Important

Do not simulate real-time information as real railway data.

Clearly label demonstration data as:

"Demo/Simulated Station Data"
