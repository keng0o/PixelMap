(function(global){
  'use strict';

  function normalizeDegrees(value){
    const degrees = Number(value);
    if (!Number.isFinite(degrees)) return 0;
    return ((degrees % 360) + 360) % 360;
  }

  function rotatePoint(point, bearing, centerX, centerY){
    const radians = -normalizeDegrees(bearing) * Math.PI / 180;
    const dx = point[0] - centerX;
    const dy = point[1] - centerY;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    return [
      centerX + dx * cosine - dy * sine,
      centerY + dx * sine + dy * cosine,
    ];
  }

  function inverseRotatePoint(point, bearing, centerX, centerY){
    return rotatePoint(point, -normalizeDegrees(bearing), centerX, centerY);
  }

  function screenVectorToWorld(vector, bearing){
    const radians = normalizeDegrees(bearing) * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    return [
      vector[0] * cosine - vector[1] * sine,
      vector[0] * sine + vector[1] * cosine,
    ];
  }

  function worldVectorToScreen(vector, bearing){
    const radians = -normalizeDegrees(bearing) * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    return [
      vector[0] * cosine - vector[1] * sine,
      vector[0] * sine + vector[1] * cosine,
    ];
  }

  function fixedVanishingProjection(
    point, vanishingPoint, height, referencePoint, maxHeightMultiplier = 1.35
  ){
    const projectedHeight = Math.max(0, Number(height) || 0);
    if (!projectedHeight) return [0, 0];
    const dx = point[0] - vanishingPoint[0];
    const dy = point[1] - vanishingPoint[1];
    const distance = Math.hypot(dx, dy);
    const referenceDistance = Math.hypot(
      referencePoint[0] - vanishingPoint[0],
      referencePoint[1] - vanishingPoint[1]
    );
    if (!distance || !referenceDistance) return [0, 0];
    const uncappedMagnitude = projectedHeight * distance / referenceDistance;
    const maxMagnitude = projectedHeight * Math.max(1, Number(maxHeightMultiplier) || 1);
    const magnitude = Math.min(uncappedMagnitude, maxMagnitude);
    return [dx / distance * magnitude, dy / distance * magnitude];
  }

  global.PixelMapBearing = Object.freeze({
    normalizeDegrees,
    rotatePoint,
    inverseRotatePoint,
    screenVectorToWorld,
    worldVectorToScreen,
    fixedVanishingProjection,
  });
})(typeof window === 'undefined' ? globalThis : window);
