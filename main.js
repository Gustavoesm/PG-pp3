//const matrizes = require('./matrizes')
const loadObj = require('./loadObj')
const mvNew = require('./MVnew')
//const bresenham = require('bresenham-js')

const at = mvNew.vec3(-2, 0.0, 0.0);
const up = mvNew.vec3(0.0, 1.0, 0.0);
var eye = mvNew.vec3(0.5, 0.5, 3);
var fov = 60.0; 
var aspect = 4/3;  
var near = 0.3;
var far = 5.0;

class obj{
    constructor(fileName){
        var objex = loadObj.loadObj(fileName)
        this.vertexBuffer = objex.vertices
        this.indexBuffer = objex.triangleIndices
        this.modelMatrix = new mvNew.mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        )
        this.operationsList = []
    }
    translation(x, y, z){
        var translationMatrix = new mvNew.mat4(
            1.0,  0.0,   0.0,  x,
            0.0,  1.0,   0.0,  y,
            0.0,  0.0,   1.0,  z,
            0.0,  0.0,   0.0,  1.0
        )
        operationsList.push(translationMatrix);  
    }
    scale(Sx, Sy, Sz) {
        var scaleMatrix = new mvNew.mat4(
            Sx,   0.0,  0.0,  0.0,
            0.0,  Sy,   0.0,  0.0,
            0.0,  0.0,  Sz,   0.0,
            0.0,  0.0,  0.0,  1.0
         )
         operationsList.push(scaleMatrix);
    }
    getPoints(vertices, mode){
        var max_x = vertices[0], max_y = vertices[1], max_z = vertices[2]
        var min_x = max_x, min_y = max_y, min_z = max_z
    
        for(let i = 3; i < vertices.length;i++){
            if(i % 3 == 0){
                if(vertices[i] < min_x){
                    min_x = vertices[i]
                }
                if(vertices[i] > max_x){
                    max_x = vertices[i]
                }
            }else if(i % 3 == 1){
                if(vertices[i] < min_y){
                    min_y = vertices[i]
                }
                if(vertices[i] > max_y){
                    max_y = vertices[i]
                }
            }else if(i % 3 == 2){
                if(vertices[i] < min_z){
                    min_z = vertices[i]
                }
                if(vertices[i] > max_z){
                    max_z = vertices[i]
                }
            }
        }
    
        if(mode == 0){
            var x = (max_x + min_x) / 2
            var y = (max_y + min_y) / 2
            var z = (max_z + min_z) / 2
        }else{
            var x = (max_x - min_x)
            var y = (max_y - min_y)
            var z = (max_z - min_z)
        }
    
        return {
            "x" : x,
            "y" : y,
            "z" : z
        }
    }
    calculateTransformations(vertices, index){
        var points = getPoints(vertices,1)
    
        let size_x = 2/points.x
        let size_y = 2/points.y
        let size_z = 2/points.z
        
        var mediumPoint = getPoints(vertices,0)
        let mp_x = mediumPoint.x
        let mp_y = mediumPoint.y
        let mp_z = mediumPoint.z
        
         translation(-mp_x, -mp_y, mp_z)
        if(index == 0){
             translation(1.0 , 0.0, 0.0)
        }else{
             translation(-1.0 , 0.0, 0.0)
        }
         scale(size_x, size_y, size_z)
    }
    calculateFinalModelMatrix(){
        while(this.operationsList.length != 0){
            this.modelMatrix = multiplyMatrices(this.modelMatrix, operationsList.pop());
        }
    }
}

class camera{
    constructor(at,up,eye,fov,aspect,near,far){
        var n = mvNew.normalize(mvNew.negate(at));
        var u = mvNew.normalize(mvNew.cross(up, n));
        var v = mvNew.cross(n, u);
        this.vMatrix = new mvNew.mat4(
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
        this.vMatrix = mvNew.mult(cameraPosition, this.vMatrix)
        this.pMatrix = new mvNew.mat4(
            1/(aspect * (Math.tan(mvNew.radians(fov)/2))), 0.0, 0.0, 0.0,
            0.0, 1/Math.tan((mvNew.radians(fov)/2)), 0.0, 0.0,
            0.0, 0.0, -((far + near)/(far - near)), -((2*(far * near))/(far - near)),
            0.0, 0.0, -1.0, 0.0
        )
    }
}

var objeto = new obj('coarseTri.egea2.obj')
var cam = new camera(at,up,eye,fov,aspect,near,far)

//multiplicar ((model x view) x projection) x vertexbuffer
objeto.calculateFinalModelMatrix()

var finalMatrix = multiplyMatrices(objeto.modelMatrix,cam.vMatrix)
finalMatrix = multiplyMatrices(finalMatrix, cam.pMatrix)
finalMatrix = multiplyMatrices(finalMatrix,objeto.vertexBuffer)
console.log(finalMatrix)

//var matrix_bresenham = bresenham(objeto.vertexBuffer, objeto.indexBuffer)
//console.log(JSON.stringify(matrix_bresenham));

function multiplyMatrices(matrixA, matrixB)
{
    // Slice the second matrix up into rows
    let row0 = [matrixB[0], matrixB[1], matrixB[2], matrixB[3]];
    let row1 = [matrixB[4], matrixB[5], matrixB[6], matrixB[7]];
    let row2 = [matrixB[8], matrixB[9], matrixB[10], matrixB[11]];
    let row3 = [matrixB[12], matrixB[13], matrixB[14], matrixB[15]];

    // Multiply each row by matrixA
    let result0 = multiplyMatrixAndPoint(matrixA, row0);
    let result1 = multiplyMatrixAndPoint(matrixA, row1);
    let result2 = multiplyMatrixAndPoint(matrixA, row2);
    let result3 = multiplyMatrixAndPoint(matrixA, row3);

    // Turn the result rows back into a single matrix
    return [
        result0[0], result0[1], result0[2], result0[3],
        result1[0], result1[1], result1[2], result1[3],
        result2[0], result2[1], result2[2], result2[3],
        result3[0], result3[1], result3[2], result3[3]
    ];
}
function multiplyMatrixAndPoint(matrix, point) {
    // Give a simple variable name to each part of the matrix, a column and row number
    let c0r0 = matrix[ 0], c1r0 = matrix[ 1], c2r0 = matrix[ 2], c3r0 = matrix[ 3];
    let c0r1 = matrix[ 4], c1r1 = matrix[ 5], c2r1 = matrix[ 6], c3r1 = matrix[ 7];
    let c0r2 = matrix[ 8], c1r2 = matrix[ 9], c2r2 = matrix[10], c3r2 = matrix[11];
    let c0r3 = matrix[12], c1r3 = matrix[13], c2r3 = matrix[14], c3r3 = matrix[15];
  
    // Now set some simple names for the point
    let x = point[0];
    let y = point[1];
    let z = point[2];
    let w = point[3];
  
    // Multiply the point against each part of the 1st column, then add together
    let resultX = (x * c0r0) + (y * c0r1) + (z * c0r2) + (w * c0r3);
  
    // Multiply the point against each part of the 2nd column, then add together
    let resultY = (x * c1r0) + (y * c1r1) + (z * c1r2) + (w * c1r3);
  
    // Multiply the point against each part of the 3rd column, then add together
    let resultZ = (x * c2r0) + (y * c2r1) + (z * c2r2) + (w * c2r3);
  
    // Multiply the point against each part of the 4th column, then add together
    let resultW = (x * c3r0) + (y * c3r1) + (z * c3r2) + (w * c3r3);
  
    return [resultX, resultY, resultZ, resultW];
}
function rasterizacao(vertices, indices){

}