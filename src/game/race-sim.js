(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenGameSim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const normalizeAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

  function createCar(id, name, color, lane = 0) {
    return { id, name, color, progress: 0, lateral: lane, speed: 0, laps: 0, finished: false, boost: 100, lastCheckpoint: 0 };
  }

  function stepCar(car, input, dt, config = {}) {
    const throttle = clamp(Number(input?.throttle) || 0, 0, 1);
    const brake = clamp(Number(input?.brake) || 0, 0, 1);
    const steer = clamp(Number(input?.steer) || 0, -1, 1);
    const boost = Boolean(input?.boost) && car.boost > 0;
    const maxSpeed = (config.maxSpeed || 42) * (boost ? 1.3 : 1);
    car.speed = clamp(car.speed + throttle * 20 * dt - brake * 32 * dt - (0.55 + car.speed * 0.025) * dt, 0, maxSpeed);
    car.lateral = clamp((car.lateral || 0) + steer * dt * (0.9 + car.speed / 30), -0.9, 0.9);
    const corneringLimit = 40 - Math.abs(car.lateral) * 10;
    if (car.speed > corneringLimit) car.speed = Math.max(corneringLimit, car.speed - 16 * dt);
    car.progress = ((car.progress || 0) + car.speed * dt / (config.trackLength || 240)) % 1;
    car.boost = clamp(car.boost + (boost ? -24 : 7) * dt, 0, 100);
    return car;
  }

  return { clamp, normalizeAngle, createCar, stepCar };
});
