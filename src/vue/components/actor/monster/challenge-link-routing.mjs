/**
 * Pure helpers for the columns-view challenge link overlay: anchor geometry,
 * straight-line clearance tests, and orthogonal elbow routing. All inputs and
 * outputs are in unscaled overlay (wrapper) coordinates.
 */

const CORNER = Math.SQRT1_2;

// Fixed offset (in px) for the near-edge anchors on the left/right sides.
// Fixed px (rather than a fraction of the card height) keeps these aligned
// across cards of different heights, since the columns flow top-aligns the
// cards within each row.
const EDGE_OFFSET = 20;
// Cap so very short cards can't fold the two offsets into each other.
const EDGE_OFFSET_MAX_FRACTION = 0.3;

/**
 * Anchor registry, three per edge plus the four corners:
 * - top/bottom edges: `top-left`, `top`, `top-right`, `bottom-left`,
 *   `bottom`, `bottom-right` — fractions along the edge (left to right).
 * - left/right edges: `left-top`, `left`, `left-bottom`, `right-top`,
 *   `right`, `right-bottom` — `*-top` sits EDGE_OFFSET px below the card's
 *   top and `*-bottom` EDGE_OFFSET px above its bottom (fixed px, not
 *   fractions, so facing anchors on top-aligned cards line up).
 * - corners: `corner-*` names, with diagonal normals so elbow stubs leave
 *   them at 45 degrees.
 */
export const ANCHORS = {
	// Top edge.
	"top-left": { edge: "top", t: 0.25, nx: 0, ny: -1 },
	top: { edge: "top", t: 0.5, nx: 0, ny: -1 },
	"top-right": { edge: "top", t: 0.75, nx: 0, ny: -1 },
	// Bottom edge.
	"bottom-left": { edge: "bottom", t: 0.25, nx: 0, ny: 1 },
	bottom: { edge: "bottom", t: 0.5, nx: 0, ny: 1 },
	"bottom-right": { edge: "bottom", t: 0.75, nx: 0, ny: 1 },
	// Left edge.
	"left-top": { edge: "left", offset: EDGE_OFFSET, nx: -1, ny: 0 },
	left: { edge: "left", t: 0.5, nx: -1, ny: 0 },
	"left-bottom": { edge: "left", offset: -EDGE_OFFSET, nx: -1, ny: 0 },
	// Right edge.
	"right-top": { edge: "right", offset: EDGE_OFFSET, nx: 1, ny: 0 },
	right: { edge: "right", t: 0.5, nx: 1, ny: 0 },
	"right-bottom": { edge: "right", offset: -EDGE_OFFSET, nx: 1, ny: 0 },
	// Corners.
	"corner-top-left": { edge: "corner", nx: -CORNER, ny: -CORNER },
	"corner-top-right": { edge: "corner", nx: CORNER, ny: -CORNER },
	"corner-bottom-left": { edge: "corner", nx: -CORNER, ny: CORNER },
	"corner-bottom-right": { edge: "corner", nx: CORNER, ny: CORNER }
};

/**
 * Resolve an anchor id to a point on the card's border.
 *
 * @param {{x: number, y: number, w: number, h: number}} rect  The card rect
 * @param {string} id                                           The anchor id
 * @returns {{x: number, y: number}|null} The anchor point, or null for unknown ids
 */
export function anchorPoint(rect, id) {
	const anchor = ANCHORS[id];
	if (!anchor) return null;
	if (anchor.edge === "corner") {
		return {
			x: id.includes("left") ? rect.x : rect.x + rect.w,
			y: id.includes("top") ? rect.y : rect.y + rect.h
		};
	}
	if (anchor.offset !== undefined) {
		// Fixed px offset from the card's top (positive) or bottom (negative),
		// capped so short cards can't fold top and bottom anchors together.
		const cap = rect.h * EDGE_OFFSET_MAX_FRACTION;
		const off = Math.min(Math.abs(anchor.offset), cap);
		const y = anchor.offset >= 0 ? rect.y + off : rect.y + rect.h - off;
		return anchor.edge === "left" ? { x: rect.x, y } : { x: rect.x + rect.w, y };
	}
	switch (anchor.edge) {
		case "top":
			return { x: rect.x + (rect.w * anchor.t), y: rect.y };
		case "bottom":
			return { x: rect.x + (rect.w * anchor.t), y: rect.y + rect.h };
		case "left":
			return { x: rect.x, y: rect.y + (rect.h * anchor.t) };
		default:
			return { x: rect.x + rect.w, y: rect.y + (rect.h * anchor.t) };
	}
}

/**
 * Outward unit normal of an anchor (the direction an elbow stub leaves in).
 *
 * @param {string} id The anchor id
 * @returns {{x: number, y: number}} The unit normal vector
 */
export function anchorNormal(id) {
	const anchor = ANCHORS[id];
	return anchor ? { x: anchor.nx, y: anchor.ny } : { x: 0, y: 0 };
}

/**
 * Liang-Barsky segment/AABB intersection test.
 *
 * @param {{x: number, y: number}} p1    Segment start
 * @param {{x: number, y: number}} p2    Segment end
 * @param {{x: number, y: number, w: number, h: number}} rect  Axis-aligned rect
 * @returns {boolean} Whether any part of the segment lies inside the rect
 */
function segmentIntersectsRect(p1, p2, rect) {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	let t0 = 0;
	let t1 = 1;
	const bounds = [
		[-dx, p1.x - rect.x],
		[dx, rect.x + rect.w - p1.x],
		[-dy, p1.y - rect.y],
		[dy, rect.y + rect.h - p1.y]
	];
	for (const [p, q] of bounds) {
		if (p === 0) {
			if (q < 0) return false;
			continue;
		}
		const t = q / p;
		if (p < 0) {
			if (t > t1) return false;
			if (t > t0) t0 = t;
		}
		else {
			if (t < t0) return false;
			if (t < t1) t1 = t;
		}
	}
	return true;
}

/**
 * Whether the straight segment between two anchors is clear of both endpoint
 * cards (shrunk slightly so anchors sitting on the border don't self-clip).
 *
 * @param {{x: number, y: number}} p1                    Segment start
 * @param {{x: number, y: number}} p2                    Segment end
 * @param {{x: number, y: number, w: number, h: number}} rectA  Source card rect
 * @param {{x: number, y: number, w: number, h: number}} rectB  Target card rect
 * @param {number} [inset]                               Shrink applied to each card
 * @returns {boolean} Whether the straight route is usable
 */
export function segmentClearOfCards(p1, p2, rectA, rectB, inset = 2) {
	const shrink = (rect) => ({
		x: rect.x + inset,
		y: rect.y + inset,
		w: Math.max(0, rect.w - (inset * 2)),
		h: Math.max(0, rect.h - (inset * 2))
	});
	return !segmentIntersectsRect(p1, p2, shrink(rectA)) && !segmentIntersectsRect(p1, p2, shrink(rectB));
}

/**
 * Route a link between two anchors. Prefers a straight line when it is clear
 * of both endpoint cards and the anchors don't point the same way; otherwise
 * stubs out along each anchor's normal and joins the stubs with an
 * orthogonal L, which collapses to the classic out-down-in bracket route for
 * same-side anchors (e.g. left-to-left renders as "[" rather than a bare
 * line hugging the card edges).
 *
 * @param {{x: number, y: number, w: number, h: number}} rectA  Source card rect
 * @param {string} idA                                           Source anchor id
 * @param {{x: number, y: number, w: number, h: number}} rectB  Target card rect
 * @param {string} idB                                           Target anchor id
 * @param {number} [stub]                                        Elbow stub length in px
 * @returns {{d: string, points: Array<{x: number, y: number}>}} SVG path data and route points
 */
export function routeLink(rectA, idA, rectB, idB, stub = 20) {
	const pA = anchorPoint(rectA, idA);
	const pB = anchorPoint(rectB, idB);
	if ((pA === null) || (pB === null)) return { d: "", points: [] };

	const nA = anchorNormal(idA);
	const nB = anchorNormal(idB);

	// Same-side anchors (both normals pointing the same way) always route
	// through stubs — a straight line there would hug the card edges like a
	// bare "|" instead of the bracketed "[" shape the statblocks use.
	const sameSide = ((nA.x * nB.x) + (nA.y * nB.y)) > 0;
	if (!sameSide && segmentClearOfCards(pA, pB, rectA, rectB)) {
		return { d: `M ${pA.x} ${pA.y} L ${pB.x} ${pB.y}`, points: [pA, pB] };
	}

	const a1 = { x: pA.x + (nA.x * stub), y: pA.y + (nA.y * stub) };
	const b1 = { x: pB.x + (nB.x * stub), y: pB.y + (nB.y * stub) };
	const dx = b1.x - a1.x;
	const dy = b1.y - a1.y;
	const corner = Math.abs(dx) >= Math.abs(dy) ? { x: b1.x, y: a1.y } : { x: a1.x, y: b1.y };
	const points = [pA, a1, corner, b1, pB]
		.filter((p, i, arr) => (i === 0) || (p.x !== arr[i - 1].x) || (p.y !== arr[i - 1].y));
	const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
	return { d, points };
}

/**
 * A sine wave that follows a polyline route (straight or elbow), oscillating
 * perpendicular to the local segment direction and tapering to zero at both
 * endpoints.
 *
 * @param {Array<{x: number, y: number}>} points  Route points from routeLink
 * @param {number} [wavelength]                   Wave length in px
 * @param {number} [amp]                          Wave amplitude in px
 * @returns {string} SVG path data
 */
export function squigglePath(points, wavelength = 22, amp = 4.5) {
	if (points.length < 2) return "";
	const segments = [];
	let total = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const a = points[i];
		const b = points[i + 1];
		const len = Math.hypot(b.x - a.x, b.y - a.y);
		segments.push({ a, b, len, start: total });
		total += len;
	}
	if (total === 0) return `M ${points[0].x} ${points[0].y}`;
	// Dense sampling (~8 points per wavelength): sparser strides alias —
	// when the stride approaches half a wavelength, consecutive samples land
	// near the sine's zero crossings and the wave flattens unevenly along the
	// line.
	const steps = Math.max(16, Math.ceil((total / wavelength) * 8));
	let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
	for (let i = 1; i <= steps; i++) {
		const s = (total * i) / steps;
		const segment = segments.find((seg) => s <= seg.start + seg.len) ?? segments[segments.length - 1];
		const t = segment.len === 0 ? 0 : (s - segment.start) / segment.len;
		const nx = -((segment.b.y - segment.a.y) / (segment.len || 1));
		const ny = (segment.b.x - segment.a.x) / (segment.len || 1);
		const off = i === steps ? 0 : amp * Math.sin((s / wavelength) * Math.PI * 2);
		const x = segment.a.x + ((segment.b.x - segment.a.x) * t) + (nx * off);
		const y = segment.a.y + ((segment.b.y - segment.a.y) * t) + (ny * off);
		d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
	}
	return d;
}

/**
 * Pick facing anchors for a link that has none (e.g. drawn in map view):
 * horizontal sides for side-by-side cards, vertical midpoints for stacked ones.
 *
 * @param {{x: number, y: number, w: number, h: number}} rectA  Source card rect
 * @param {{x: number, y: number, w: number, h: number}} rectB  Target card rect
 * @returns {[string, string]} Source and target anchor ids
 */
export function autoAnchors(rectA, rectB) {
	const ca = { x: rectA.x + (rectA.w / 2), y: rectA.y + (rectA.h / 2) };
	const cb = { x: rectB.x + (rectB.w / 2), y: rectB.y + (rectB.h / 2) };
	const dx = cb.x - ca.x;
	const dy = cb.y - ca.y;
	if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ["right", "left"] : ["left", "right"];
	return dy >= 0 ? ["bottom", "top"] : ["top", "bottom"];
}
