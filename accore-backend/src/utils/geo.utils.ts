import * as turf from "@turf/turf";

export const findDownstreamRisks = (
  sourceCoords: number[],
  sourceElevation: number,
  targetCoords: number[],
  targetElevation: number,
  maxRadiusMeters: number = 500
): boolean => {
  // Turf calculates the exact distance over the Earth's curvature.
  // We identify a downstream risk if the target is within the radius and has a lower elevation.
  const sourcePoint = turf.point(sourceCoords);
  const targetPoint = turf.point(targetCoords);

  const distance = turf.distance(sourcePoint, targetPoint, { units: "meters" });

  if (distance > maxRadiusMeters) {
    return false;
  }

  return targetElevation < sourceElevation;
};