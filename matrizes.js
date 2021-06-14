const mvNew = require('./MVnew')

const at = mvNew.vec3(-2, 0.0, 0.0);
const up = mvNew.vec3(0.0, 1.0, 0.0);
var eye = mvNew.vec3(0.5, 0.5, 3);
var fov = 60.0; 
var aspect;  
var near = 0.3;
var far = 5.0;


var mMatrix = new mvNew.mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
)

var n = mvNew.normalize(negate(at));
var u = mvNew.normalize(cross(up, n));
var v = mvNew.cross(n, u);

var vMatrix = new mvNew.mat4(
    u[0], u[1], u[2], 0.0,
    v[0], v[1], v[2], 0.0,
    n[0], n[1], n[2], 0.0,
    0.0,  0.0,  0.0,  1.0
)

var cameraPosition = new mvNew.mat4(
    1.0,  0.0,   0.0,  -eye[0],
    0.0,  1.0,   0.0,  -eye[1],
    0.0,  0.0,   1.0,  -eye[2],
    0.0,  0.0,   0.0,  1.0
)

var vMatrix = mvNew.mult(cameraPosition, vMatrix)

var pMatrix = new mvNew.mat4(
    1/(aspect * (Math.tan(radians(fov)/2))), 0.0, 0.0, 0.0,
    0.0, 1/Math.tan((radians(fov)/2)), 0.0, 0.0,
    0.0, 0.0, -((far + near)/(far - near)), -((2*(far * near))/(far - near)),
    0.0, 0.0, -1.0, 0.0
)