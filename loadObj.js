const fs = require('fs')

function loadObj(path)
{
    const obj_text = fs.readFileSync('models/coarseTri.hand.obj', 'utf8')
 
    // OBJ Parser
 
    // Gets only the lines as showed below:
    // v -0.703621 0.033242 0.000000
    // And captures each vertex point when matched
    const obj_vertex_regex = /^v +(.*) +(.*) +(.*)$/;
    const obj_face_regex = /^f +(\d+) +(\d+) +(\d+)$/;
    const obj_full_face_regex = /^f +(\d+\/\d+\/\d+) +(\d+\/\d+\/\d+) +(\d+\/\d+\/\d+) +(\d+\/\d+\/\d+)/;
 
    const lines = obj_text.split('\n');
 
    let vertices = new Array;
    let triangleIndices = new Array;
    
    lines.forEach(element => {
        element = element.trim();
        if (obj_vertex_regex.test(element)) {
            let match = obj_vertex_regex.exec(element);
            vertices.push(parseFloat(match[1]));
            vertices.push(parseFloat(match[2]));
            vertices.push(parseFloat(match[3]));
            vertices.push(1.0);
        }
        else if (obj_face_regex.test(element))
        {
            let match = obj_face_regex.exec(element);
 
            // OBJ indices start at 1
            // Subtracting 1 from every index since JavaScript indices start at 0
 
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
 
        }
    });
 
    return {vertices:Float32Array.from(vertices), triangleIndices:Uint16Array.from(triangleIndices)}

}

module.exports = {
    loadObj
}