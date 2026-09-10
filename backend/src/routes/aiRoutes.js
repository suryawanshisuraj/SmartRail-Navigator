import express from 'express';

export function createAIRouter(telemetrySimulator) {
  const router = express.Router();

  router.post('/chat', (req, res) => {
    const { message = '', context = {} } = req.body;
    const lower = message.toLowerCase();

    let reply = "I am your SmartRail Copilot. You can ask me about train departure times, platform locations, accessibility options, or delay updates.";
    let action = null;

    if (lower.includes('wheelchair') || lower.includes('step-free') || lower.includes('elevator') || lower.includes('accessible')) {
      reply = "For step-free navigation at Central Grand Terminal: Please proceed through Wide Fare Gate 1, use Elevator EL-2 located right next to the Customer Information Lounge, and descend to Level -2 for Platform 4 access. Dedicated boarding ramps are staffed 24/7.";
      action = { type: 'HIGHLIGHT_ACCESSIBLE_PATH', platform: 'Platform 4', elevatorId: 'EL-2' };
    } else if (lower.includes('delay') || lower.includes('late') || lower.includes('status')) {
      const trains = telemetrySimulator ? telemetrySimulator.getActiveTrains() : [];
      const delayed = trains.filter(t => t.delayMinutes > 0);
      if (delayed.length > 0) {
        reply = `Currently, ${delayed[0].serviceName} is running with a minor ${delayed[0].delayMinutes}-minute delay due to signal regulation ahead. Other lines are operating on schedule.`;
        action = { type: 'SHOW_TRAIN_STATUS', trainId: delayed[0].id };
      } else {
        reply = "All active passenger train services are currently operating on-time with clear track signals.";
        action = { type: 'SHOW_ALL_ON_TIME' };
      }
    } else if (lower.includes('platform') || lower.includes('where is')) {
      reply = "Platforms 1A and 1B are situated on Ground Level (Concourse). Platforms 2A, 2B, and 4B are located on Level -1 and Level -2 accessible via Central Elevators and Escalator Bank A.";
      action = { type: 'OPEN_STATION_MAP' };
    } else if (lower.includes('ticket') || lower.includes('fare') || lower.includes('cost') || lower.includes('price')) {
      reply = "Standard one-way tickets start at $3.50 base + $0.20/km. Off-peak travel (10:00 to 16:00) receives a 15% discount. You can preview your exact ticket in the Fare & Pass calculator tab.";
      action = { type: 'NAVIGATE_TAB', tab: 'fare' };
    } else if (lower.includes('hello') || lower.includes('hi')) {
      reply = "Hello! Welcome to SmartRail-Navigator. How can I assist with your journey today? You can search routes, check live train positions, or explore station platform maps.";
    }

    res.json({
      success: true,
      reply,
      action
    });
  });

  return router;
}
