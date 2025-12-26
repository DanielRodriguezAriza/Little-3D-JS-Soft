// Constants
const COLOR_BG = "black";
const COLOR_FG = "green";
const POINT_SIZE = 10;
const LINE_WIDTH = 5;

// Setup canvas
let canvas = document.getElementById("renderer_canvas");
canvas.width = 800;
canvas.height = 800;

// Setup context
let ctx = canvas.getContext("2d");

// Constructors
function vec2(px, py) {
	return {x: px, y: py};
}
function vec3(px, py, pz) {
	return {x: px, y: py, z: pz};
}
function mesh(m_vertices, m_indices, m_color, m_position) {
	return {
		vertices: m_vertices,
		indices: m_indices,
		color: m_color,
		position: m_position
	};
}
function add(u, v) {
	return vec3(u.x + v.x, u.y + v.y, u.z + v.z);
}
function sub(u, v) {
	return vec3(u.x - v.x, u.y - v.y, u.z - v.z);
}
function dot(u, v) {
	return u.x * v.x + u.y * v.y + u.z * v.z;
}
function cross(u, v) {
	return vec3(u.y*v.z-u.z*v.y, u.z*v.x-u.x*v.z, u.x*v.y-u.y*v.x);
}
function vec3_length2(v) {
	return v.x * v.x + v.y * v.y + v.z * v.z;
}
function vec3_length(v) {
	return Math.sqrt(vec3_length2(v));
}
function vec3_normalize(v) {
	const len = vec3_length(v);
	return vec3(v.x / len, v.y / len, v.z / len);
}
function mid(points) {
	m = vec3(0, 0, 0);
	for(let i = 0; i < points.length; ++i) {
		m.x += points[i].x;
		m.y += points[i].y;
		m.z += points[i].z;
	}
	m.x = m.x / points.length;
	m.y = m.y / points.length;
	m.z = m.z / points.length;
	return m;
}

function vec2_det(u, v) { // NOTE : Used for signed area for backface culling
	return (u.x * v.y - v.x * u.y);
}

// Functions
function logVec2(p) {
	console.log("the point is : [" + p.x + ", " + p.y + "]");
}
function logVec3(p) {
	console.log(p);
	console.log("the point is : [" + p.x + ", " + p.y + ", " + p.z + "]");
}

function colorString(c) {
	return "rgb(" + c.x * 255 + " " + c.y * 255 + " " + c.z * 255 + ")";
}

function clear() {
	ctx.fillStyle = COLOR_BG;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRect(x, y, w, h) {
	ctx.fillStyle = COLOR_FG;
	ctx.fillRect(x, y, w, h);
}

function drawPoint(p, s) {
	let h = s / 2;
	drawRect(p.x - h, p.y - h, s, s);
}

function drawLine(p0, p1) {
	ctx.lineWidth = LINE_WIDTH;
	ctx.strokeStyle = COLOR_FG;
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.stroke();
}

function drawTriPoly(p0, p1, p2, color) {
	// Extract the color string
	let colorStr = colorString(color);
	
	let points = [p0, p1, p2];
	let minPoint = vec2(points[0].x, points[0].y);
	let maxPoint = vec2(points[0].x, points[0].y);
	for(let i = 0; i < 3; ++i) {
		if(points[i].x < minPoint.x) {
			minPoint.x = points[i].x;
		}
		if(points[i].y < minPoint.y) {
			minPoint.y = points[i].y;
		}
		if(points[i].x > maxPoint.x) {
			maxPoint.x = points[i].x;
		}
		if(points[i].y > maxPoint.y) {
			maxPoint.y = points[i].y;
		}
	}
	
	const gradient = ctx.createLinearGradient(minPoint.x, minPoint.y, maxPoint.x, maxPoint.y);
	gradient.addColorStop(0, "red");
	gradient.addColorStop(1, "blue");
	
	// Fill the polygon
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.closePath();
	ctx.fill();
	
	// Patch for small gaps between other polygons (these appear due to precission errors)
	ctx.strokeStyle = gradient;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.stroke();
	ctx.moveTo(p1.x, p1.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.stroke();
	ctx.moveTo(p0.x, p0.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.stroke();
}

function projectPoint(p3d) {
	let p2d = {
		x: p3d.x / p3d.z,
		y: p3d.y / p3d.z
	};
	return p2d;
}
function screenPoint(p2dview) {
	let p2dscreen = {
		x: ((p2dview.x + 1) / 2) * canvas.width,
		y: (1 - (p2dview.y + 1) / 2) * canvas.height,
	};
	return p2dscreen;
}

function drawVertex(p) {
	drawPoint(screenPoint(projectPoint(p)), POINT_SIZE);
}

function drawEdge(p0, p1) {
	drawLine(screenPoint(projectPoint(p0)), screenPoint(projectPoint(p1)));
}

// NOTE : Would be faster if we just used the internal functions and translated the points only once... bruh...
function drawTriangle(p0, p1, p2) {
	drawVertex(p0);
	drawVertex(p1);
	drawVertex(p2);
	drawEdge(p0, p1);
	drawEdge(p1, p2);
	drawEdge(p2, p0);
}
function drawTriangleFilled(p0, p1, p2, color) {
	let q0 = screenPoint(projectPoint(p0));
	let q1 = screenPoint(projectPoint(p1));
	let q2 = screenPoint(projectPoint(p2));
	
	let u = sub(q1, q0);
	let v = sub(q2, q0);
	let a = vec2_det(u, v);
	
	if(a > 0) {
		drawTriPoly(q0, screenPoint(projectPoint(p1)), screenPoint(projectPoint(p2)), color);
	}
}

function rotateX(p, angle) {
	let c = Math.cos(angle);
	let s = Math.sin(angle);
	let q = {
		x: p.x,
		y: c * p.y - s * p.z,
		z: s * p.y + c * p.z
	};
	return q;
}
function rotateY(p, angle) {
	let c = Math.cos(angle);
	let s = Math.sin(angle);
	let q = {
		x: p.x * c - p.z * s,
		y: p.y,
		z: p.x * s + p.z * c
	};
	return q;
}
function translate(p, q) {
	let r = {
		x: p.x + q.x,
		y: p.y + q.y,
		z: p.z + q.z
	};
	return r;
}

function drawMesh(vertices, indices, color, position, angle) {
	// Draw the vertices
	/*for(let i = 0; i < indices.length; i+=1) {
		drawVertex(translate(rotateX(rotateY(vertices[indices[i]], angle), angle), position));
	}*/
	
	// Draw the edges
	for(let i = 0; i < indices.length; i+=3) {
		let p0 = vertices[indices[i + 0]];
		let p1 = vertices[indices[i + 1]];
		let p2 = vertices[indices[i + 2]];
		p0 = translate(rotateX(rotateY(p0, angle), 0), position);
		p1 = translate(rotateX(rotateY(p1, angle), 0), position);
		p2 = translate(rotateX(rotateY(p2, angle), 0), position);
		
		u = vec3_normalize(sub(p1, p0));
		v = vec3_normalize(sub(p2, p0));
		n = vec3_normalize(cross(u, v));
		
		// drawEdge(p0, add(p1, u));
		// drawEdge(p0, add(p2, v));
		// m = mid([p0, p1, p2]);
		// drawEdge(m, add(m, n));
		
		l = vec3(0, 0, -1);
		h = vec3_normalize(add(l, n));
		d = dot(n, h);
		c = vec3(d * color.x, d * color.y, d * color.z);
		
		drawTriangleFilled(p0, p1, p2, c);
	}
}

/*let vertices = [
	vec3(-0.5, -0.5, -0.5), vec3(0.5, -0.5, -0.5), vec3(0.5, 0.5, -0.5), vec3(-0.5, 0.5, -0.5),
	vec3(-0.5, -0.5,  0.5), vec3(0.5, -0.5,  0.5), vec3(0.5, 0.5,  0.5), vec3(-0.5, 0.5,  0.5),
];
let indices = [
	0, 1, 2,    0, 2, 3, // Front side
	4, 5, 6,    4, 6, 7, // Back side
	4, 0, 3,    4, 3, 7, // Left side
	1, 5, 6,    1, 6, 2, // Right side
	3, 2, 6,    3, 6, 7, // Top side
	0, 1, 5,    0, 5, 4, // Bottom side
];*/

/*let vertices = [
	vec3(-0.5, -0.5, -0.5), vec3(0.5, -0.5, -0.5), vec3(0.5, 0.5, -0.5), vec3(-0.5, 0.5, -0.5),
	vec3(-0.5, -0.5,  0.5), vec3(0.5, -0.5,  0.5), vec3(0.5, 0.5,  0.5), vec3(-0.5, 0.5,  0.5),
];
let indices = [
	0, 1, 2,    0, 2, 3, // Front side
	5, 4, 7,    5, 7, 6, // Back side
	4, 0, 3,    4, 3, 7, // Left side
	1, 5, 6,    1, 6, 2, // Right side
	3, 2, 6,    3, 6, 7, // Top side
	0, 1, 5,    0, 5, 4, // Bottom side
];*/

let vertices = [
	vec3(-0.5, -0.5,  0.5), vec3(0.5, -0.5,  0.5), vec3(0.5, 0.5,  0.5), vec3(-0.5, 0.5,  0.5),
	vec3(-0.5, -0.5, -0.5), vec3(0.5, -0.5, -0.5), vec3(0.5, 0.5, -0.5), vec3(-0.5, 0.5, -0.5),
	// vec3(-0.5, -0.5,  0.0), vec3(0.5, -0.5,  0.0), vec3(0.5, 0.5,  0.0), vec3(-0.5, 0.5,  0.0), // NOTE : Extra face to test depth buffering
];
let indices = [
	0, 1, 2,    0, 2, 3, // Front side
	5, 4, 7,    5, 7, 6, // Back side
	4, 0, 3,    4, 3, 7, // Left side
	1, 5, 6,    1, 6, 2, // Right side
	3, 2, 6,    3, 6, 7, // Top side
	4, 5, 1,    4, 1, 0, // Bottom side
	// 8, 9,10,    8,10,11, // NOTE : Extra side to test depth buffering
];

let meshes = [
	mesh(vertices, indices, vec3(0,0,1), vec3(-1.0, 0.0,  3.0)),
	mesh(vertices, indices, vec3(1,0,0), vec3(-1.0, 0.0, 10.0)),
	mesh(vertices, indices, vec3(0,1,0), vec3( 1.0, -1.0,  3.0)),
];

function compareDepth(a, b) {
	// NOTE : In the future, this could be changed to sort by distance to camera, or just z if we change the coordinate system to be relative to cam.
	// Anyway, the problem still stands about this being based on a per object basis rather than per polygon... not to mention that, even if it were
	// per polygon, we would still have the problem of having no support for polygon intersections.
	if(a.position.z < b.position.z) {
		return 1;
	}
	if(a.position.z > b.position.z) {
		return -1;
	}
	return 0;
}
function sortByDepth() {
	// Simple object origin based painter's algorithm.
	meshes.sort(compareDepth);
}

let FPS = 60; // 60;
let rate = 1000 / FPS;
let angle = 0;
let deltaTime = 1 / FPS;
function renderFrame() {
	angle += Math.PI * deltaTime;
	
	clear();
	for(let i = 0; i < meshes.length; ++i) {
		drawMesh(meshes[i].vertices, meshes[i].indices, meshes[i].color, meshes[i].position, angle);
	}
	
	setTimeout(renderFrame, rate);
}

function main() {
	sortByDepth();
	setTimeout(renderFrame, rate);
}

main();
