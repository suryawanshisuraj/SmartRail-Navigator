/**
 * Telemetry Simulator: Real-time train physics and kinematic tracking.
 * Advances virtual trains, simulates signal block deceleration, and emits updates.
 */

export class TelemetrySimulator {
  constructor(trains = [], broadcastCallback = null) {
    this.trains = trains.map(t => ({
      ...t,
      currentProgress: 0.25, // 0.0 to 1.0 along route
      speedKmph: t.speedKmph || 110.0,
      status: 'IN_TRANSIT',
      delayMinutes: t.delayMinutes || 0
    }));
    this.broadcastCallback = broadcastCallback;
    this.intervalId = null;
  }

  start(intervalMs = 2000) {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    this.trains.forEach(train => {
      // Simulate movement
      train.currentProgress += 0.02;
      if (train.currentProgress > 1.0) {
        train.currentProgress = 0.05;
        // Occasional simulated delay change
        if (Math.random() > 0.8) {
          train.delayMinutes = Math.floor(Math.random() * 8);
        }
      }

      // Small speed fluctuation
      const speedDelta = (Math.random() - 0.5) * 6;
      train.speedKmph = Math.max(45, Math.min(240, Number((train.speedKmph + speedDelta).toFixed(1))));

      // Interpolate coordinates between origin and destination
      if (train.originCoords && train.destinationCoords) {
        train.currentCoords = {
          lat: Number((train.originCoords.lat + train.currentProgress * (train.destinationCoords.lat - train.originCoords.lat)).toFixed(5)),
          lng: Number((train.originCoords.lng + train.currentProgress * (train.destinationCoords.lng - train.originCoords.lng)).toFixed(5))
        };
      }

      if (this.broadcastCallback) {
        this.broadcastCallback({
          event: 'TRAIN_TICK',
          data: {
            trainId: train.id,
            serviceName: train.serviceName,
            speedKmph: train.speedKmph,
            coordinates: train.currentCoords,
            delayMinutes: train.delayMinutes,
            progress: Number(train.currentProgress.toFixed(2)),
            status: train.delayMinutes > 5 ? 'DELAYED' : 'ON_TIME'
          }
        });
      }
    });
  }

  getActiveTrains() {
    return this.trains;
  }

  getTrainById(id) {
    return this.trains.find(t => t.id === id);
  }
}
