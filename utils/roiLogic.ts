export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };

/**
 * Check if a point is inside a polygon using Ray Casting algorithm.
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Check if two line segments intersect.
 */
function onSegment(p: Point, q: Point, r: Point): boolean {
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

function orientation(p: Point, q: Point, r: Point): number {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;
    return (val > 0) ? 1 : 2;
}

function doIntersect(p1: Point, q1: Point, p2: Point, q2: Point): boolean {
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
    return false;
}

/**
 * Check if a Box intersects with a Polygon (Any Part).
 * Checks:
 * 1. Any Box Corner inside Polygon?
 * 2. Any Polygon Vertex inside Box?
 * 3. Any Box Edge crosses Polygon Edge?
 */
export function isBoxIntersectingPolygon(box: Box, polygon: Point[]): boolean {
    const boxCorners = [
        { x: box.x, y: box.y },
        { x: box.x + box.width, y: box.y },
        { x: box.x + box.width, y: box.y + box.height },
        { x: box.x, y: box.y + box.height }
    ];

    // 1. Check if any box corner is in polygon
    for (const corner of boxCorners) {
        if (isPointInPolygon(corner, polygon)) return true;
    }

    // 2. Check if any polygon vertex is in box
    for (const pt of polygon) {
        if (pt.x >= box.x && pt.x <= box.x + box.width &&
            pt.y >= box.y && pt.y <= box.y + box.height) {
            return true;
        }
    }

    // 3. Check edge intersections
    for (let i = 0; i < 4; i++) {
        const p1 = boxCorners[i];
        const q1 = boxCorners[(i + 1) % 4]; // Next corner

        for (let j = 0; j < polygon.length; j++) {
            const p2 = polygon[j];
            const q2 = polygon[(j + 1) % polygon.length]; // Next vertex

            if (doIntersect(p1, q1, p2, q2)) return true;
        }
    }

    return false;
}
