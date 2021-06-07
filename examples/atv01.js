"use strict";

var gl;

window.onload = async function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    //
    //  Initialize our data for a single triangle
    //

    // First, initialize the  three points.
    
    const [vertices, wireframeIndices, triangleIndices] = await loadObj();

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


    // Associate out shader variables with our data buffer

    var aPosition = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( aPosition );

    //cor
    var color = [];
    for (let index = 0; index < (vertices.length/2); index++) {
        color.push(0.0,Math.random(),Math.random());
    }

    color = Float32Array.from(color);

    var colorBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, color, gl.STATIC_DRAW );

    var aColor = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( aColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( aColor );

    //modificações
    var mouse1 = 0;

    var bufferId2 = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufferId2 );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, wireframeIndices, gl.STATIC_DRAW );
    
    render(wireframeIndices, gl.LINES, bufferId2);

    window.addEventListener("click", (event)=>{
        if (mouse1 == 0){
            let triangleBuffer = gl.createBuffer();
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, triangleBuffer );
            gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW );
    
            let modo = gl.TRIANGLES;

            mouse1 = 1;
    
            render(triangleIndices, modo, triangleBuffer);
        }
        else if (mouse1 == 1){
            let wireframeBuffer = gl.createBuffer();
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, wireframeBuffer );
            gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, wireframeIndices, gl.STATIC_DRAW );
    
            let modo = gl.LINES;
            
            mouse1 = 0;

            render(wireframeIndices, modo, wireframeBuffer);
        }
    });
    
};

function render(indices, modo, bufferId) {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawElements( modo, indices.length, gl.UNSIGNED_SHORT, 0, 0 );
    gl.deleteBuffer(bufferId);
}

async function loadObj() {
    const response = await fetch('../obj/airfoil.obj');
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