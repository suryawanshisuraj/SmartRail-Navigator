# Database Design

## users

id
name
email
password_hash
role
created_at

## stations

id
name
city
state
created_at

## floors

id
station_id
floor_number
name

## navigation_nodes

id
floor_id
name
type
x
y
accessible

## navigation_edges

id
from_node_id
to_node_id
distance
estimated_time
accessible
blocked

## facilities

id
station_id
floor_id
name
type
node_id
description
accessible

## qr_locations

id
code
node_id
description

## platforms

id
station_id
platform_number
node_id
status

## station_updates

id
station_id
type
message
status
created_at

## crowd_status

id
station_id
location_id
level
updated_at

## emergency_locations

id
station_id
name
type
node_id

## route_history

id
user_id
start_node
destination_node
route_type
distance
estimated_time
created_at
