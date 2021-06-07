"use strict";

var gl;
var click = 0;

window.addEventListener("click", async (event)=>{
    if (click == 0){
        await init("coarseTri.egea1.obj");
        click = 1;
    }
    else if (click == 1){
        await init("coarseTri.rockerArm.obj");
        click = 0;
    }
});

async function init(objName)
{
    console.log(objName);
    var canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    //
    //  Initialize our data for a single triangle
    //

    // First, initialize the  three points.
    
    const [vertices, wireframeIndices, triangleIndices] = await loadObj(objName);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "shaders/vshader21.glsl", "shaders/fshader21.glsl" );
    gl.useProgram( program );


    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW );

    //Associate out shader variables with our data buffer

    var aPosition = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( aPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( aPosition );

    //functions
    scale(program);
    translation(program, vertices);

    //cor
    var color = [];
    if (objName == "coarseTri.egea1.obj"){
        for (let index = 0; index < (vertices.length/3); index++) {
            color.push(0.0,0.0,Math.random());
        }
    }
    else if (objName == "coarseTri.rockerArm.obj"){
        for (let index = 0; index < (vertices.length/3); index++) {
            color.push(Math.random(),0.0,0.0);
        }
    }
    color = Float32Array.from(color);

    var colorBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, color, gl.STATIC_DRAW );

    var aColor = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( aColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( aColor );

    var bufferId2 = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufferId2 );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW );
    
    render(triangleIndices, gl.TRIANGLES, bufferId2);

   /* gl.deleteBuffer(colorBufferId);
    gl.deleteBuffer(bufferId2);
    gl.deleteBuffer(bufferId);*/
};

function render(indices, modo, bufferId) {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawElements( modo, indices.length, gl.UNSIGNED_SHORT, 0, 0 );
    gl.deleteBuffer(bufferId);
}

async function loadObj(objName) {

    const response = await fetch('../obj/'+objName);

    const obj_text = await response.text();
 
    // OBJ Parser
 
    // Gets only the lines as showed below:
    // v -0.703621 0.033242 0.000000
    // And captures each vertex point when matched
    const obj_vertex_regex = /^v +([\d-]\d*\.\d+) +([\d-]\d*\.\d+) +([\d-]\d*\.\d+)$/;
    const obj_face_regex = /^f +(\d+) +(\d+) +(\d+)$/;
 
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
    });
    return [Float32Array.from(vertices),Uint16Array.from(wireframeIndices), Uint16Array.from(triangleIndices)];

}

function scale(program) {
    var Sx = 0.5, Sy = 0.5, Sz = 0.0;

    var xformMatrix = new Float32Array([
        Sx,   0.0,  0.0,  0.0,
        0.0,  Sy,   0.0,  0.0,
        0.0,  0.0,  Sz,   0.0,
        0.0,  0.0,  0.0,  1.0
     ]);

     var u_xformMatrix = gl.getUniformLocation(program, 'u_xformMatrix');
     gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);
}

function translation(program, vertices){
    let points = getPoints(vertices);
    let translation = gl.getUniformLocation(program, 'translation');
    gl.uniform4f(translation, points[0], points[1], points[2], 0.0);
}

function getPoints(vertices){
    var max_x = vertices[0], max_y = vertices[1], max_z = vertices[2];
    var min_x = max_x, min_y = max_y, min_z = max_z;

    for(let i = 3; i < vertices.length; i++){
        if(i % 3 == 0){
            if(vertices[i] < min_x)
                min_x = vertices[i];
                
            if(vertices[i] > max_x)
                max_x = vertices[i];
        }
        else if (i % 3 == 1){
            if(vertices[i] < min_y)
                min_y = vertices[i];

            if(vertices[i] > max_y)
                max_y = vertices[i];
        }
        else if (i % 3 == 2){
            if(vertices[i] < min_z)
                min_z = vertices[i];

            if(vertices[i] > max_z)
                max_z = vertices[i];
        }
    }

    var medium_X = Math.abs(max_x - min_x) / 2;
    var medium_Y = Math.abs(max_y - min_y) / 2;
    var medium_Z = Math.abs(max_z - min_z) / 2;

    console.log(medium_X, medium_Y, medium_Z);

    medium_X = (medium_X + min_x)* -1;
    medium_Y = (medium_Y + min_y)* -1;
    medium_Z = (medium_Z + min_z)* -1;

    console.log(medium_X, medium_Y, medium_Z);
    return [medium_X, medium_Y, medium_Z];
}