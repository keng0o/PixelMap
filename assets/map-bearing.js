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

  global.PixelMapBearing = Object.freeze({
    normalizeDegrees,
    rotatePoint,
    inverseRotatePoint,
    screenVectorToWorld,
    worldVectorToScreen,
  });
})(typeof window === 'undefined' ? globalThis : window);
