"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var theta_slider;
var phi_slider;

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

// initializing texture
var texSize = 256;
var numChecks = 8;
var c;
var texture1, texture2;
var t1, t2;

var image1 = new Uint8Array(4*texSize*texSize);
for ( var i = 0; i < texSize; i++ ) {
    for ( var j = 0; j <texSize; j++ ) {
        var patchx = Math.floor(i/(texSize/numChecks));
        var patchy = Math.floor(j/(texSize/numChecks));
        if(patchx%2 ^ patchy%2) c = 255;
        else //c = Math.log10(1*i*j);
        c = 255*((i) ^ ((j & 0x8)  == 0))
        image1[4*i*texSize+4*j] = c;
        image1[4*i*texSize+4*j+1] = c;
        image1[4*i*texSize+4*j+2] = c;
        image1[4*i*texSize+4*j+3] = 255;
    }
}

var image2 = new Uint8Array(4*texSize*texSize);
// Create a checkerboard pattern
for ( var i = 0; i < texSize; i++ ) {
    for ( var j = 0; j <texSize; j++ ) {
        //var e = 50;
        var e = 127*Math.floor(0.1*i*j)
        image2[4*i*texSize+4*j] = 127+e;
        image2[4*i*texSize+4*j+1] = 127+e;
        image2[4*i*texSize+4*j+2] = 127+e;
        image2[4*i*texSize+4*j+3] = 255;
       }
}
    
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function configureTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

//obstacle
var pillar1Id = 13;
var pillar2Id = 14;
var crossbar1Id = 15;
var crossbar2Id = 16;
var crossbar3Id = 17;
var crossbar4Id = 18;
var trackId = 19;

var distance = 3.5;
var pillar1Height = 5;
var pillar1Width = 0.5;
var pillar2Height = 5;
var pillar2Width = 0.5;
var crossbar1Height = 4.3;
var crossbar1Width = 0.2;
var crossbar2Height = 4.3;
var crossbar2Width = 0.2;
var crossbar3Height = 4;
var crossbar3Width = 0.2;
var crossbar4Height = 4;
var crossbar4Width = 0.2;
var trackHeight = 2;
var trackWidth = 8;

//horse
var torsoId = 0;
var headId  = 1;
var head1Id = 1;
var head2Id = 10;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var tailId = 11;
var neckId = 12;

var torsoHeight = 5.0*0.5;
var torsoWidth = 1.5*0.5;
var upperArmHeight = 3.0*0.5;
var lowerArmHeight = 2.0*0.5;
var upperArmWidth  = 0.8*0.5;
var lowerArmWidth  = 0.5*0.5;
var upperLegWidth  = 0.8*0.5;
var lowerLegWidth  = 0.5*0.5;
var lowerLegHeight = 2.0*0.5;
var upperLegHeight = 3.0*0.5;
var headHeight = 1*0.5;
var headWidth = 2*0.5;
var tailHeight = 3*0.5;
var tailWidth = 0.3*0.5;
var neckHeight = 3*0.5;
var neckWidth = 1*0.5;

// initialization of the body position
var torso_rot_Z = -90;
var torsoInit = 0;
var torsoTransInit = -13;


var legsInit = [/*left up low*/80,80, /*right up low*/130,50];
var armsInit = [/*left up low*/60,80, /*right up low*/30,30];
var tailInit = [45, 180];
var neckInit = [-45, 0];

var LEGS = [leftUpperArmId, rightUpperArmId, leftUpperLegId, rightUpperLegId];
var upperLEGSpositions = [armsInit[0], armsInit[2], legsInit[0], legsInit[2]];

var ARMS_low = [leftLowerArmId, rightLowerArmId];
var lowerARMSpositions = [armsInit[1], armsInit[3]];

var LEGS_low = [leftLowerLegId, rightLowerLegId];
var lowerLEGSpositions = [legsInit[1], legsInit[3]];

//ranges for animation
var upperLegRange = [30, 130];
var lowerArmRange = [10, 80];
var lowerLegRange = [-40, -10];
var torsoRange = [-5.5, -7.8];
var torsoAngleRange = [-15, 15];
var torsoTransRange = [-9.0, 9.0];

var numNodesObst = 7;
var numNodes = 13;
var numAngles = 11;
var angle = 0;

var theta = [90, 0, armsInit[0], armsInit[1], armsInit[2], armsInit[3], legsInit[0], legsInit[1], legsInit[2], legsInit[3], 0];

var numVertices = 24;

var stack = [];

var figure = [];

for( var i=0; i<(numNodes+numNodesObst); i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------

function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

function initNodesObst(Id) {
    var m = mat4();
    switch(Id) {
        case pillar1Id:
        m = translate(distance, 1.3, 0.0);
        m = mult(m, translate(0, 0, -2));
        m = mult(m, rotate(0, 0, 0, 1 ));
        m = mult(m, rotate(0, 1, 0, 0 ));
        figure[pillar1Id] = createNode( m, pillar1, null, pillar2Id );
        
        break;

        case pillar2Id:
        m = translate(0.0, 0.0, 4.0);
        m = mult(m, rotate(0, 0, 0, 1 ));
        m = mult(m, rotate(0, 0, 1, 0 ));
        m = mult(m, rotate(0, 1, 0, 0 ));
        figure[pillar2Id] = createNode( m, pillar2, crossbar1Id, null );
        break;

        case crossbar1Id:
        m = translate(0.0, 0.5, 4.0);
        m = mult(m, rotate(0, 0, 0, 1 ));
        m = mult(m, rotate(0, 0, 1, 0 ));
        m = mult(m, rotate(-70, 1, 0, 0 ));
        figure[crossbar1Id] = createNode( m, crossbar1, crossbar2Id, null );
        break;

        case crossbar2Id:
        m = translate(0.0, 0.5, 0.0);
        m = mult(m, rotate(0, 0, 0, 1 ));
        m = mult(m, rotate(0, 0, 1, 0 ));
        m = mult(m, rotate(70, 1, 0, 0 ));
        figure[crossbar2Id] = createNode( m, crossbar2, crossbar3Id, null );
        break;

        case crossbar3Id:
        m = translate(0.0, 0.5, 0.0);
        m = mult(m, rotate(0, 0, 0, 1 ));
        m = mult(m, rotate(0, 0, 1, 0 ));
        m = mult(m, rotate(90, 1, 0, 0 ));
        figure[crossbar3Id] = createNode( m, crossbar3, crossbar4Id, null );
        break;

        case crossbar4Id:
        m = translate(0.0, 2, 0.0);
        m = mult(m, rotate(0, 0, 0, 1 ));
        m = mult(m, rotate(0, 0, 1, 0 ));
        m = mult(m, rotate(90, 1, 0, 0 ));
        figure[crossbar4Id] = createNode( m, crossbar4, trackId, null );
        break;

        case trackId:
        m = translate(0.0, -2.0, 0.0);
        m = mult(m, translate(2, 0, 0));
        m = mult(m, translate(0, 0, 2));
        m = mult(m, rotate(0, 0, 0, 1 ));
        m = mult(m, rotate(0, 0, 1, 0 ));
        m = mult(m, rotate(0, 1, 0, 0 ));
        figure[trackId] = createNode( m, track, null, null );
        break;
    }
}

function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case torsoId:

    m = translate(torsoTransInit, 0.0, 0.0);
    m = mult(m, translate(0.0, 0.0, 0.0));
    m = mult(m, translate(0.0, 0.0, 0.0));
    m = mult(m, rotate(theta[torsoId], 1, 0, 0 ));
    m = mult(m, rotate(torso_rot_Z, 0, 0, 1 ));
    m = mult(m, rotate(jumpUp_torso, 1, 0, 0 )); //for jump
    //m = mult(m, rotate(180, 0, 0, 1)); //for coming back
    figure[torsoId] = createNode( m, torso, null, tailId );
    break;

    case tailId:

    m = rotate(tailInit[1], 0, 0, 1);
    m = mult(m, rotate(tailInit[0], 1, 0, 0));
    figure[tailId] = createNode(m, tail, neckId, null);
    break;

    case neckId:
    m = translate(0.0, torsoHeight, 0.0);
    m = mult(m, rotate(neckInit[1], 0, 0, 1));
    m = mult(m, rotate(neckInit[0], 1, 0, 0));
    figure[neckId] = createNode(m, neck, leftUpperArmId, headId);
    break;

    case headId:
    case head1Id:
    case head2Id:

    m = translate(0.0, neckHeight+0.5*headHeight, 0.5*headHeight);
	m = mult(m, rotate(theta[head1Id], 1, 0, 0))
	m = mult(m, rotate(theta[head2Id], 0, 1, 0));
    m = mult(m, translate(0.0, -0.5*headHeight, 0.0));
    figure[headId] = createNode( m, head, null, null);
    break;

    case leftUpperArmId:

    m = translate(-(torsoWidth+upperArmWidth), 0.9*torsoHeight, 0.0);
	m = mult(m, rotate(theta[leftUpperArmId], 1, 0, 0));
    figure[leftUpperArmId] = createNode( m, leftUpperArm, rightUpperArmId, leftLowerArmId );
    break;

    case rightUpperArmId:

    m = translate(torsoWidth+upperArmWidth, 0.9*torsoHeight, 0.0);
	m = mult(m, rotate(theta[rightUpperArmId], 1, 0, 0));
    figure[rightUpperArmId] = createNode( m, rightUpperArm, leftUpperLegId, rightLowerArmId );
    break;

    case leftUpperLegId:

    m = translate(-(torsoWidth+upperLegWidth), 0.1*upperLegHeight, 0.0);
	m = mult(m , rotate(theta[leftUpperLegId], 1, 0, 0));
    figure[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
    break;

    case rightUpperLegId:

    m = translate(torsoWidth+upperLegWidth, 0.1*upperLegHeight, 0.0);
	m = mult(m, rotate(theta[rightUpperLegId], 1, 0, 0));
    figure[rightUpperLegId] = createNode( m, rightUpperLeg, null, rightLowerLegId );
    break;

    case leftLowerArmId:

    m = translate(0.0, upperArmHeight, 0.0);
    m = mult(m, rotate(theta[leftLowerArmId], 1, 0, 0));
    figure[leftLowerArmId] = createNode( m, leftLowerArm, null, null );
    break;

    case rightLowerArmId:

    m = translate(0.0, upperArmHeight, 0.0);
    m = mult(m, rotate(theta[rightLowerArmId], 1, 0, 0));
    figure[rightLowerArmId] = createNode( m, rightLowerArm, null, null );
    break;

    case leftLowerLegId:

    m = translate(0.0, upperLegHeight, 0.0);
    m = mult(m, rotate(theta[leftLowerLegId], 1, 0, 0));
    figure[leftLowerLegId] = createNode( m, leftLowerLeg, null, null );
    break;

    case rightLowerLegId:

    m = translate(0.0, upperLegHeight, 0.0);
    m = mult(m, rotate(theta[rightLowerLegId], 1, 0, 0));
    figure[rightLowerLegId] = createNode( m, rightLowerLeg, null, null );
    break;

    }

}

function traverse(Id) {

   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function pillar1() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*pillar1Height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( pillar1Width, pillar1Height, pillar1Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function pillar2() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*pillar2Height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( pillar2Width, pillar2Height, pillar2Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function crossbar1() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*crossbar1Height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( crossbar1Width, crossbar1Height, crossbar1Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function crossbar2() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*crossbar2Height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( crossbar2Width, crossbar2Height, crossbar2Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function crossbar3() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*crossbar3Height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( crossbar3Width, crossbar3Height, crossbar3Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function crossbar4() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*crossbar4Height, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( crossbar4Width, crossbar4Height, crossbar4Width));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function track() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*trackHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( 6*trackWidth, trackHeight, 4*trackWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 1);
 
    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1);

    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);
}

function torso() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

     
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);
 
    //gl.activeTexture( gl.TEXTURE1 );
    //gl.bindTexture( gl.TEXTURE_2D, texture2 );
    //gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1);
 

    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 1);
}

function head() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(0.7*headWidth, headHeight, headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1)


    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1)

    }

function tail() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function neck() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * neckHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(neckWidth, neckHeight, neckWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  leftUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     texCoordsArray.push(texCoord[1]);
     
     pointsArray.push(vertices[c]);
     texCoordsArray.push(texCoord[2]);
     
     pointsArray.push(vertices[d]);
     texCoordsArray.push(texCoord[3]);

}


function cube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    var size = (window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth);
    canvas.width = size;
    canvas.height = size;

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();


    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    cube();

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

   // activate texture mapping
   configureTexture();
 
    // get info from screen
    document.getElementById("pause_anim").onclick = function () {
        pauseAnimation();
    };

    theta_slider = document.getElementById("slide_theta");
    phi_slider = document.getElementById("slide_phi");

    for(i=0; i<numNodes; i++) initNodes(i);
    for(i=numNodes; i<(numNodes+numNodesObst); i++) initNodesObst(i);

    render();
}

var horseLength = tailWidth + torsoWidth + headWidth;
var animation = true;
var currentAnimPosition = 0.0;
var jumpUp_torso = 0;

function pauseAnimation() {
    animation = !animation;
}

function updateModelViewMatrix() {
    var radius = 1;
    var thetha = theta_slider.value;    
    var phi = phi_slider.value;

    var eye = vec3(radius*Math.sin(thetha*Math.PI/360)*Math.cos(phi*Math.PI/360), 
    radius*Math.sin(thetha*Math.PI/360)*Math.sin(phi*Math.PI/360), radius*Math.cos(thetha*Math.PI/360));

    modelViewMatrix = lookAt(eye, /*at*/vec3(0.0, 0.0, 0.0), /*up*/vec3(0.0, 1.0, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotateY(-90));
    modelViewMatrix = mult(modelViewMatrix, rotateY(90));
    modelViewMatrix = mult(modelViewMatrix, scalem(0.8, 0.8, 0.8));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

function NewPosition(initPosition, given_range) {
    var range = given_range[1] - given_range[0];
    var position = currentAnimPosition + (initPosition - given_range[0]) / range;
    var newPosition = range * (Math.sin(position) / 2.5 + 0.5) + given_range[0];
    return newPosition > given_range[1] ? given_range[0] + newPosition - given_range[1] : newPosition;
}


function legs_rotation(m, angle) {
    return mult(m, rotate(angle, 1, 0, 0));
}

function runUpperLegsPositions() {

    for (var i = 0; i < LEGS.length; i++) {

        var newPosition = NewPosition(upperLEGSpositions[i], upperLegRange);
        var currentLegId = LEGS[i];
        figure[currentLegId].transform = legs_rotation(figure[currentLegId].transform, newPosition - theta[currentLegId]);
        theta[currentLegId] = newPosition;
    }
}

function runLowerArmsPositions() {

    for (var i = 0; i < ARMS_low.length; i++) {

        var newPosition = NewPosition(lowerARMSpositions[i], lowerArmRange);
        var currentLegId = ARMS_low[i];
        figure[currentLegId].transform = legs_rotation(figure[currentLegId].transform, newPosition - theta[currentLegId]);
        theta[currentLegId] = newPosition;
    }
}

function runLowerLegsPositions() {

    for (var i = 0; i < LEGS_low.length; i++) {

        var newPosition = NewPosition(lowerLEGSpositions[i], lowerLegRange);
        var currentLegId = LEGS_low[i];
        figure[currentLegId].transform = legs_rotation(figure[currentLegId].transform, newPosition - theta[currentLegId]);
        theta[currentLegId] = newPosition;
    }
}

function runTorsoPosition(torsoRange) {
    let newTorsoPosition = NewPosition(torsoInit, torsoRange);
    let newTorsoAngle = NewPosition(jumpUp_torso, torsoAngleRange);
    figure[torsoId].transform = mult(figure[torsoId].transform, translate(0, 0, newTorsoPosition - torsoInit));
    figure[torsoId].transform = mult(figure[torsoId].transform, rotate(newTorsoAngle - jumpUp_torso, 1, 0, 0));
    torsoInit = newTorsoPosition;
    jumpUp_torso = newTorsoAngle;
}

function runAnimation() {
    var runPos = 0;
        
        if (figure[torsoId].transform[0][3] > -13.5 && figure[torsoId].transform[0][3] < 1) {
            currentAnimPosition += 0.25;
            runPos += 0.2;
            runTorsoPosition(torsoRange);
            runUpperLegsPositions();
            runLowerArmsPositions();
            runLowerLegsPositions();
        }
        if (figure[torsoId].transform[0][3] >= 1 && figure[torsoId].transform[0][3] < 4) {
            runPos += 0.2;
            currentAnimPosition += 0.1;
            runTorsoPosition([-7.5, 7.5]);
            runUpperLegsPositions();
            runLowerArmsPositions();
            runLowerLegsPositions();
        }
        if (figure[torsoId].transform[0][3] >= 4 && figure[torsoId].transform[0][3] < 9.5) {
            runPos += 0.1;
            currentAnimPosition += 0.3;
            runTorsoPosition(torsoRange);
            runUpperLegsPositions();
            runLowerArmsPositions();
            runLowerLegsPositions();
        }

        figure[torsoId].transform = mult(figure[torsoId].transform, translate(0, runPos, 0))

}

var render = function() {

    if (animation) { runAnimation() }
    
    updateModelViewMatrix();

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST)
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    traverse(pillar1Id);
    traverse(torsoId);

    setTimeout(function () {
        requestAnimFrame(render);
    }, 30);
        
}
