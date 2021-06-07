"use strict"

var gl
var zoom = 1;
const at = vec3(-2, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var eye = vec3(0.5, 0.5, 3);
var fov = 60.0; 
var aspect;  
var near = 0.3;
var far = 5.0;
var operationsList = [];

window.onload = async function loadFunc(){
    var obj2 = '../../obj/coarseTri.egea2.obj'
    var obj1 = '../../obj/coarseTri.botijo.obj'
    var objects = [obj1, obj2]

    await init(objects)

    document.getElementById("b1").onclick = function(){zoom -= 1; loadFunc(); eye[2] = zoom;};
    document.getElementById("b2").onclick = function(){zoom += 1; loadFunc(); eye[2] = zoom;};
    
}

async function init(objects)
{
    var canvas = document.getElementById( "gl-canvas" )
    
    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ) }

    aspect =  canvas.width/canvas.height;

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height )
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 )

    gl.enable(gl.DEPTH_TEST);
    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "shaders/vshader21.glsl", "shaders/fshader21.glsl" )
    
    gl.useProgram( program )
    
    var objload1 = await loadObj(objects[0])
    var objload2 = await loadObj(objects[1])
    var objectsLoad = [objload1, objload2]
    for (let i = 0; i < 2; i++) {
        var global = objectsLoad[i] 
        // Load the data into the GPU

        var bufferId = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId )
        gl.bufferData( gl.ARRAY_BUFFER, global.vertices, gl.STATIC_DRAW )

        // Associate out shader variables with our data buffer

        var aPosition = gl.getAttribLocation( program, "aPosition" )
        gl.vertexAttribPointer( aPosition, 3, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( aPosition )
        
        var colorArray = []

        for(let i = 0;i < global.vertices.length*2;i++){
            colorArray.push(Math.random(),0.0,0.0)
        }

        colorArray = Float32Array.from(colorArray)

        var colorbufferId = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, colorbufferId )
        gl.bufferData( gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW )

        // Associate out shader variables with our data buffer

        var aColor = gl.getAttribLocation( program, "aColor" )
        gl.vertexAttribPointer( aColor, 3, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( aColor )

        
        var bufferId2 = gl.createBuffer()
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufferId2 )
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, global.triangleIndices, gl.STATIC_DRAW )

        var mMatrix = new mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        )

        var n = normalize(negate(at));
        var u = normalize(cross(up, n));
        var v = cross(n, u);

        var vMatrix = new mat4(
            u[0], u[1], u[2], 0.0,
            v[0], v[1], v[2], 0.0,
            n[0], n[1], n[2], 0.0,
            0.0,  0.0,  0.0,  1.0
        )

        var cameraPosition = new mat4(
            1.0,  0.0,   0.0,  -eye[0],
            0.0,  1.0,   0.0,  -eye[1],
            0.0,  0.0,   1.0,  -eye[2],
            0.0,  0.0,   0.0,  1.0
        )

        var vMatrix = mult(cameraPosition, vMatrix)

        var position_vMatrix = gl.getUniformLocation(program, 'vMatrix');
        gl.uniformMatrix4fv(position_vMatrix, false, flatten(vMatrix));

        var pMatrix = new mat4(
            1/(aspect * (Math.tan(radians(fov)/2))), 0.0, 0.0, 0.0,
            0.0, 1/Math.tan((radians(fov)/2)), 0.0, 0.0,
            0.0, 0.0, -((far + near)/(far - near)), -((2*(far * near))/(far - near)),
            0.0, 0.0, -1.0, 0.0
        )
        var position_pMatrix = gl.getUniformLocation(program, 'pMatrix');
        gl.uniformMatrix4fv(position_pMatrix, false, flatten(pMatrix));
        
        await calculateTransformations(global.vertices, i)

        while(operationsList.length != 0){
            mMatrix = mult(mMatrix, operationsList.pop());
        }

        var position_mMatrix = gl.getUniformLocation(program, 'mMatrix');
        gl.uniformMatrix4fv(position_mMatrix, false, flatten(mMatrix));

        gl.drawElements( gl.TRIANGLES, global.triangleIndices.length, gl.UNSIGNED_SHORT, 0, 0 )
        gl.deleteBuffer(bufferId2)
        gl.deleteBuffer(colorbufferId)

    }
}

async function scale(Sx, Sy, Sz) {
    var scaleMatrix = new mat4(
        Sx,   0.0,  0.0,  0.0,
        0.0,  Sy,   0.0,  0.0,
        0.0,  0.0,  Sz,   0.0,
        0.0,  0.0,  0.0,  1.0
     )
     operationsList.push(scaleMatrix);
}

async function translation(x, y, z){
    var translationMatrix = new mat4(
        1.0,  0.0,   0.0,  x,
        0.0,  1.0,   0.0,  y,
        0.0,  0.0,   1.0,  z,
        0.0,  0.0,   0.0,  1.0
    )
    operationsList.push(translationMatrix);  
}

function getPoints(vertices, mode){
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

async function calculateTransformations(vertices, index){
    var points = getPoints(vertices,1)

    let size_x = 2/points.x
    let size_y = 2/points.y
    let size_z = 2/points.z
    
    var mediumPoint = getPoints(vertices,0)
    let mp_x = mediumPoint.x
    let mp_y = mediumPoint.y
    let mp_z = mediumPoint.z
    
    await translation(-mp_x, -mp_y, mp_z)
    if(index == 0){
        await translation(1.0 , 0.0, 0.0)
    }else{
        await translation(-1.0 , 0.0, 0.0)
    }
    await scale(size_x, size_y, size_z)

}


async function loadObj(path)
{
    const response = await fetch(path);
    const obj_text = await response.text();
 
    // OBJ Parser
 
    // Gets only the lines as showed below:
    // v -0.703621 0.033242 0.000000
    // And captures each vertex point when matched
    const obj_vertex_regex = /^v +(.*) +(.*) +(.*)$/;
    const obj_face_regex = /^f +(\d+) +(\d+) +(\d+)$/;
    const obj_full_face_regex = /^f +(\d+\/\d+\/\d+) +(\d+\/\d+\/\d+) +(\d+\/\d+\/\d+) +(\d+\/\d+\/\d+)/;
 
    const lines = obj_text.split('\n');
 
    let vertices = new Array;
    let wireframeIndices = new Array;
    let triangleIndices = new Array;
    
    lines.forEach(element => {
        element = element.trim();
        if (obj_vertex_regex.test(element)) {
            let match = obj_vertex_regex.exec(element);
            vertices.push(parseFloat(match[1]));
            vertices.push(parseFloat(match[2]));
            vertices.push(parseFloat(match[3]));
        }
        else if (obj_face_regex.test(element))
        {
            let match = obj_face_regex.exec(element);
 
            // OBJ indices start at 1
            // Subtracting 1 from every index since JavaScript indices start at 0
            wireframeIndices.push(parseInt(match[1]) - 1);
            wireframeIndices.push(parseInt(match[2]) - 1);
 
            wireframeIndices.push(parseInt(match[1]) - 1);
            wireframeIndices.push(parseInt(match[3]) - 1);
 
            wireframeIndices.push(parseInt(match[2]) - 1);
            wireframeIndices.push(parseInt(match[3]) - 1);
 
            triangleIndices.push(parseInt(match[1]) - 1);
            triangleIndices.push(parseInt(match[2]) - 1);
            triangleIndices.push(parseInt(match[3]) - 1);
        }
        else if (obj_full_face_regex.test(element))
        {
            let match = obj_full_face_regex.exec(element);
            
            // Quad's first triangle
            triangleIndices.push(parseInt(match[1].split('/')[0] - 1));
            triangleIndices.push(parseInt(match[2].split('/')[0] - 1));
            triangleIndices.push(parseInt(match[4].split('/')[0] - 1));
 
            // Quad's second triangle
            triangleIndices.push(parseInt(match[2].split('/')[0] - 1));
            triangleIndices.push(parseInt(match[3].split('/')[0] - 1));
            triangleIndices.push(parseInt(match[4].split('/')[0] - 1));
 
 
            wireframeIndices.push(parseInt(match[1].split('/')[0] - 1));
            wireframeIndices.push(parseInt(match[2].split('/')[0] - 1));
 
            wireframeIndices.push(parseInt(match[1].split('/')[0] - 1));
            wireframeIndices.push(parseInt(match[4].split('/')[0] - 1));
 
            wireframeIndices.push(parseInt(match[2].split('/')[0] - 1));
            wireframeIndices.push(parseInt(match[3].split('/')[0] - 1));
 
            wireframeIndices.push(parseInt(match[3].split('/')[0] - 1));
            wireframeIndices.push(parseInt(match[4].split('/')[0] - 1));
        }
    });
 
    return {vertices:Float32Array.from(vertices), wireframeIndices:Uint16Array.from(wireframeIndices), triangleIndices:Uint16Array.from(triangleIndices)}
    
}