var gl;
var shaderProgram;
var uPMatrix;

var vertexPositionBuffer;
var vertexColorBuffer;
var vertexCoordsBuffer;
var vertexNormalBuffer;
let vertexPosition = [];
let vertexNormal = [];
let vertexColor = [];
let vertexCoords = [];

let stepSize = 0.5;
let stepSizeRev = -1 * stepSize;
let stepAngleSize = 1;
let stepAngleSizeRev = stepAngleSize * -1;
let CameraX = -35;
let CameraY = 0;
let CameraZ = -50;
var angleZ = 0.0;
var angleY = 0.0;
var angleX = 0.0;

let uMVMatrix = [
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    CameraX,CameraY,CameraZ,1];

let uMVRotZ = [
    +Math.cos(angleZ*Math.PI/180.0),+Math.sin(angleZ*Math.PI/180.0),0,0,
    -Math.sin(angleZ*Math.PI/180.0),+Math.cos(angleZ*Math.PI/180.0),0,0,
    0,0,1,0,
    0,0,0,1];
    
let uMVRotY = [
    +Math.cos(angleY*Math.PI/180.0),0,-Math.sin(angleY*Math.PI/180.0),0,
    0,1,0,0,
    +Math.sin(angleY*Math.PI/180.0),0,+Math.cos(angleY*Math.PI/180.0),0,
    0,0,0,1];
    
let uMVRotX = [
    1,0,0,0,
    0,+Math.cos(angleX*Math.PI/180.0),+Math.sin(angleX*Math.PI/180.0),0,
    0,-Math.sin(angleX*Math.PI/180.0),+Math.cos(angleX*Math.PI/180.0),0,
    0,0,0,1];

let uMVIdentity = [
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1];

let Objects = [[]];
let ObjectModels = [[]];
let SpinEnableA = true;
let SpinEnableB = true;

let texturesBuffer = [];

function MatrixMul(a,b) {
    let c = [
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0]
    for(let i=0;i<4;i++) {
        for(let j=0;j<4;j++) {
            c[i*4+j] = 0.0;
            for(let k=0;k<4;k++){
                c[i*4+j]+= a[i*4+k] * b[k*4+j];
            }
        }
    }
    return c;
}

uMVMatrix = MatrixMul(uMVMatrix,uMVRotX);
uMVMatrix = MatrixMul(uMVMatrix,uMVRotY);
uMVMatrix = MatrixMul(uMVMatrix,uMVRotZ);

function createRect2(p1x,p1y,p1z,p2x,p2y,p2z,p3x,p3y,p3z,p4x,p4y,p4z) {
  let vertexPosition = [p1x,p1y,p1z, p2x,p2y,p2z, p4x,p4y,p4z,  //Pierwszy trójkąt
                        p1x,p1y,p1z, p4x,p4y,p4z, p3x,p3y,p3z]; //Drugi trójkąt
                        
  return vertexPosition;
}

function createRectCoords(mu,mv,dau,dav,dbu,dbv) {
  let p1u = mu;             p1v = mv;            
  let p2u = mu + dau;       p2v = mv + dav;      
  let p3u = mu + dbu;       p3v = mv + dbv;      
  let p4u = mu + dau + dbu; p4v = mv + dav + dbv;
  
  let vertexCoord = [p1u,p1v, p2u,p2v, p4u,p4v,  //Pierwszy trójkąt
                     p1u,p1v, p4u,p4v, p3u,p3v]; //Drugi trójkąt
                        
  return vertexCoord;
}

function createRectCoords2(p1u,p1v,p2u,p2v,p3u,p3v,p4u,p4v) {
  let vertexCoord = [p1u,p1v, p2u,p2v, p4u,p4v,  //Pierwszy trójkąt
                     p1u,p1v, p4u,p4v, p3u,p3v]; //Drugi trójkąt
                        
  return vertexCoord;
}

function createRectColor(r,g,b) {
  let vertexColor = [r,g,b, r,g,b, r,g,b,  //Pierwszy trójkąt
                     r,g,b, r,g,b, r,g,b]; //Drugi trójkąt
                        
  return vertexColor;
}

function createNormal(p1x,p1y,p1z,p2x,p2y,p2z,p3x,p3y,p3z) {
  let v1x = p2x - p1x;
  let v1y = p2y - p1y;
  let v1z = p2z - p1z;
  
  let v2x = p3x - p1x;
  let v2y = p3y - p1y;
  let v2z = p3z - p1z;
  
  let v3x =  v1y*v2z - v1z*v2y;
  let v3y =  v1z*v2x - v1x*v2z;
  let v3z =  v1x*v2y - v1y*v2x;
  
  vl = Math.sqrt(v3x*v3x+v3y*v3y+v3z*v3z); //Obliczenie długości wektora
   
  v3x/=vl; //Normalizacja na zakreś -1 1
  v3y/=vl;
  v3z/=vl;
  
  let vertexNormal = [v3x,v3y,v3z, v3x,v3y,v3z, v3x,v3y,v3z];
  return vertexNormal;
}

function CreateSphere(x,y,z,radius, numStepsElevation, numStepsAngle) {
    //Opis sceny 3D, położenie punktów w przestrzeni 3D w formacie X,Y,Z 
    let vertexPosition = []; //3 punkty po 3 składowe - X1,Y1,Z1, X2,Y2,Z2, X3,Y3,Z3 - 1 trójkąt
    let vertexNormal = [];
    let vertexColor = []; //3 punkty po 3 składowe - R1,G1,B1, R2,G2,B2, R3,G3,B3 - 1 trójkąt
    let vertexCoords = []; //3 punkty po 2 składowe - U1,V1, U2,V2, U3,V3 - 1 trójkąt
    
    let stepElevation = 90/numStepsElevation;
    let stepAngle = 360/numStepsAngle;
    for(let elevation=-90; elevation < 90; elevation+= stepElevation) {
        let radiusXZ = radius*Math.cos(elevation*Math.PI/180);
        let radiusY  = radius*Math.sin(elevation*Math.PI/180);
        
        let radiusXZ2 = radius*Math.cos((elevation+stepElevation)*Math.PI/180);
        let radiusY2  = radius*Math.sin((elevation+stepElevation)*Math.PI/180);
        
        for(let angle = 0; angle < 360; angle+= stepAngle) {
            let px1 = radiusXZ*Math.cos(angle*Math.PI/180);
            let py1 = radiusY;
            let pz1 = radiusXZ*Math.sin(angle*Math.PI/180);
            
            let px2 = radiusXZ*Math.cos((angle+stepAngle)*Math.PI/180);
            let py2 = radiusY;
            let pz2 = radiusXZ*Math.sin((angle+stepAngle)*Math.PI/180);
            
            let px3 = radiusXZ2*Math.cos(angle*Math.PI/180);
            let py3 = radiusY2;
            let pz3 = radiusXZ2*Math.sin(angle*Math.PI/180);
            
            let px4 = radiusXZ2*Math.cos((angle+stepAngle)*Math.PI/180);
            let py4 = radiusY2;
            let pz4 = radiusXZ2*Math.sin((angle+stepAngle)*Math.PI/180);
            
            vertexPosition.push(...createRect2(px1+x,py1+y,pz1+z,px2+x,py2+y,pz2+z,px3+x,py3+y,pz3+z,px4+x,py4+y,pz4+z));
            
            let p1 = Math.sqrt(px1*px1+py1*py1+pz1*pz1)
            let p2 = Math.sqrt(px2*px2+py2*py2+pz2*pz2)
            let p3 = Math.sqrt(px3*px3+py3*py3+pz3*pz3)
            let p4 = Math.sqrt(px4*px4+py4*py4+pz4*pz4)
            
            px1 /= p1
            py1 /= p1
            pz1 /= p1
            
            px2 /= p2
            py2 /= p2
            pz2 /= p2
            
            px3 /= p3
            py3 /= p3
            pz3 /= p3
            
            px4 /= p4
            py4 /= p4
            pz4 /= p4
            
            vertexNormal.push(...createRect2(px1,py1,pz1,px2,py2,pz2,px3,py3,pz3,px4,py4,pz4));
            
            vertexColor.push(...createRectColor(1.0,1.0,1.0));
            
            vertexCoords.push(...createRectCoords(angle/360.0,(elevation+90.0)/180.0,(stepAngle)/360.0,0.0,0.0,(stepElevation)/180.0));
        }
    }
    return [vertexPosition, vertexColor, vertexCoords, vertexNormal];
}

function startGL() {
    let canvas = document.getElementById("canvas3D"); //wyszukanie obiektu w strukturze strony 
    gl = canvas.getContext("experimental-webgl"); //pobranie kontekstu OpenGL'u z obiektu canvas
    gl.viewportWidth = canvas.width; //przypisanie wybranej przez nas rozdzielczości do systemu OpenGL
    gl.viewportHeight = canvas.height;

    //Kod shaderów
    const vertextShaderSource = ` //Znak akcentu z przycisku tyldy - na lewo od przycisku 1 na klawiaturze
        precision highp float;
        attribute vec3 aVertexPosition; 
        attribute vec3 aVertexColor;
        attribute vec2 aVertexCoords;
        attribute vec3 aVertexNormal;
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        varying vec3 vPos;
        varying vec3 vColor;
        varying vec2 vTexUV;
        varying vec3 vNormal;
        void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); //Dokonanie transformacji położenia punktów z przestrzeni 3D do przestrzeni obrazu (2D)
        vPos = aVertexPosition;
        vColor = aVertexColor;
        vTexUV = aVertexCoords;
        vNormal = aVertexNormal;
        }
    `;
    const fragmentShaderSource = `
        precision highp float;
        varying vec3 vPos;
        varying vec3 vColor;
        varying vec2 vTexUV;
        varying vec3 vNormal;
        uniform sampler2D uSampler;
        uniform vec3 uLightPosition;
        void main(void) {
        vec3 lightDirection = normalize(uLightPosition - vPos);
        float brightness = max(dot(vNormal,lightDirection), 0.0);
        //gl_FragColor = vec4(vColor,1.0); //Ustalenie stałego koloru wszystkich punktów sceny
        //gl_FragColor = texture2D(uSampler,vTexUV)*vec4(vColor,1.0); //Odczytanie punktu tekstury i przypisanie go jako koloru danego punktu renderowaniej figury
        //gl_FragColor = vec4((vNormal+vec3(1.0,1.0,1.0))/2.0,1.0); 
        //gl_FragColor = clamp(texture2D(uSampler,vTexUV) * vec4(brightness,brightness,brightness,1.0),0.0,1.0);
        gl_FragColor = texture2D(uSampler,vTexUV);
        }
    `;
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); //Stworzenie obiektu shadera 
    let vertexShader   = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource); //Podpięcie źródła kodu shader
    gl.shaderSource(vertexShader, vertextShaderSource);
    gl.compileShader(fragmentShader); //Kompilacja kodu shader
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) { //Sprawdzenie ewentualnych błedów kompilacji
        alert(gl.getShaderInfoLog(fragmentShader));
        return null;
    }
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertexShader));
        return null;
    }
  
    shaderProgram = gl.createProgram(); //Stworzenie obiektu programu 
    gl.attachShader(shaderProgram, vertexShader); //Podpięcie obu shaderów do naszego programu wykonywanego na karcie graficznej
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) alert("Could not initialise shaders");  //Sprawdzenie ewentualnych błedów
    
  // ==========================================================================================================

    [vertexPosition, vertexColor, vertexCoords, vertexNormal] = CreateSphere(0, 0, 0 , 1, 6, 12);

    SpinEnableA = true;
    SpinEnableB = true;
    //               X   Y   Z   R      A    As     B   Bs      Text   Rel   Orb
    Objects[ 0] = [  0,  0,  0,  3.00,  0,   0.50,  0,  0.00,   0                 ];
    Objects[ 1] = [ 10,  0,  0,  0.60,  0,   5.00,  0,  1.00,   1                 ];
    Objects[ 2] = [ 15,  0,  0,  0.90,  0,  -1.50,  0,  0.80,   2                 ]; // opposite spin
    Objects[ 3] = [ 20,  0,  0,  1.00,  0,   1.00,  0,  0.50,   3                 ];
    Objects[ 4] = [  0,  0,  0,  0.25,  0,   3.00,  0,  2.00,   4,     3,    2.00 ];
    Objects[ 5] = [ 25,  0,  0,  0.95,  0,   0.90,  0,  0.45,   5                 ];
    Objects[ 6] = [ 37,  0,  0,  5.00,  0,   0.90,  0,  0.10,   6                 ];
    Objects[ 7] = [  0,  0,  0,  0.40,  0,   0.00,  0,  2.25,   7,     6,    7.00 ]; // synchronous orbit As = 0
    Objects[ 8] = [ 52,  0,  0,  3.00,  0,   0.90,  0,  0.10,   9                 ];
    Objects[ 9] = [  0,  0,  0,  0.40,  0,   0.00,  0,  3.00,   8,     8,    5.00 ]; // synchronous orbit As = 0
    Objects[10] = [ 64,  0,  0,  3.50,  0,  -0.90,  0,  0.08,  10,                ]; // opposite spin
    Objects[11] = [ 75,  0,  0,  3.25,  0,   1.10,  0,  0.05,  11,                ];
    Objects[12] = [ 85,  0,  0,  0.69,  0,   0.75,  0,  0.03,  12,                ];

  // ==========================================================================================================
  
    vertexPositionBuffer = gl.createBuffer(); //Stworzenie tablicy w pamieci karty graficznej
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3; //zdefiniowanie liczby współrzednych per wierzchołek
    vertexPositionBuffer.numItems = vertexPosition.length/9; //Zdefinoiowanie liczby trójkątów w naszym buforze
    
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColor), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 3;
    vertexColorBuffer.numItems = vertexColor.length/9;
    
    vertexCoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexCoords), gl.STATIC_DRAW);
    vertexCoordsBuffer.itemSize = 2;
    vertexCoordsBuffer.numItems = vertexCoords.length/6;
    
    vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormal), gl.STATIC_DRAW);
    vertexNormalBuffer.itemSize = 3;
    vertexNormalBuffer.numItems = vertexNormal.length/9;
    
    let textureWidth = 500;
    let textureHeight = 500;
    //let textureContainer = document.getElementById("textureContainer");
    var textureImg = new Image();
    textureImg.onload = function() { //Wykonanie kodu automatycznie po załadowaniu obrazka
        for(let x = 0; x < 4; x++){
            for(let y = 0; y < 4; y++){
                textureBuffer = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, textureBuffer);

                let canvas = document.createElement('canvas');
                canvas.width = textureWidth;
                canvas.height = textureHeight;
                let tmpCanvas = canvas.getContext('2d');
                tmpCanvas.drawImage(textureImg, y * textureWidth, x * textureHeight, textureWidth, textureHeight, 0, 0, textureWidth, textureHeight);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

                // Push the texture buffer into the array
                texturesBuffer.push(textureBuffer);

                 // Create an <img> element to display the texture
                //let img = document.createElement("img");
                //img.src = canvas.toDataURL(); // Convert canvas to data URL
                //textureContainer.appendChild(img); // Append the <img> element to the container
            }
        }
    }
    textureImg.src="textures.jpg"; //Nazwa obrazka
    
  //Macierze opisujące położenie wirtualnej kamery w przestrzenie 3D
  let aspect = gl.viewportWidth/gl.viewportHeight;
  let fov = 45.0 * Math.PI / 180.0; //Określenie pola widzenia kamery
  let zFar = 100.0; //Ustalenie zakresów renderowania sceny 3D (od obiektu najbliższego zNear do najdalszego zFar)
  let zNear = 0.1;
  uPMatrix = [
   1.0/(aspect*Math.tan(fov/2)),0                           ,0                         ,0                            ,
   0                         ,1.0/(Math.tan(fov/2))         ,0                         ,0                            ,
   0                         ,0                           ,-(zFar+zNear)/(zFar-zNear)  , -1,
   0                         ,0                           ,-(2*zFar*zNear)/(zFar-zNear) , 20.0,
  ];
  Tick();
} 

function Tick() {
    let angle = 0;    
    for(let i = 0; i < Objects.length; i++) {
        // Start with basic identity matrix
        let uMVIdent = uMVIdentity;

        if(SpinEnableA) {
            // Increase self-angle
            angle =  Objects[i][4]; // A
            angle += Objects[i][5]; // As
            angle %= 360;
            Objects[i][4] = angle;

            // Apply self-rotation
            let uMVRotY = [
                +Math.cos(angle*Math.PI/180.0),0,-Math.sin(angle*Math.PI/180.0),0,
                0,1,0,0,
                +Math.sin(angle*Math.PI/180.0),0,+Math.cos(angle*Math.PI/180.0),0,
                0,0,0,1];
            uMVIdent = MatrixMul(uMVIdent, uMVRotY);
        }
        
        // Scale
        let scale = Objects[i][3];
        uMVScale = [
            scale,0,0,0,
            0,scale,0,0,
            0,0,scale,0,
            0,0,0,1];
        uMVIdent = MatrixMul(uMVIdent, uMVScale);
        
        // is standalone or orbits something
        if(Objects[i][9] == undefined) {
            // Apply coordinates
            X = Objects[i][0];
            Y = Objects[i][1];
            Z = Objects[i][2];
            let uMVCoord = [
                1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                X,Y,Z,1];
            uMVIdent = MatrixMul(uMVIdent, uMVCoord);
            if(SpinEnableB) {
                // Increase outer-angle
                angle =  Objects[i][6]; // B
                angle += Objects[i][7]; // Bs
                angle %= 360;
                Objects[i][6] = angle;

                // Apply outer-rotation
                uMVRotY = [
                    +Math.cos(angle*Math.PI/180.0),0,-Math.sin(angle*Math.PI/180.0),0,
                    0,1,0,0,
                    +Math.sin(angle*Math.PI/180.0),0,+Math.cos(angle*Math.PI/180.0),0,
                    0,0,0,1];
                uMVIdent = MatrixMul(uMVIdent, uMVRotY);
            }
            
            Objects[i][10] = uMVIdent[12];
            Objects[i][11] = uMVIdent[13];
            Objects[i][12] = uMVIdent[14];  
        } else {
            // Give orbit
            let R = Objects[i][10];
            let uMVOrbit = [
                1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                R,0,0,1];
            uMVIdent = MatrixMul(uMVIdent, uMVOrbit);

            if(SpinEnableB) {
                // Increase outer-angle
                angle =  Objects[i][6]; // B
                angle += Objects[i][7]; // Bs
                angle %= 360;
                Objects[i][6] = angle;

                // Apply outer-rotation
                uMVRotY = [
                    +Math.cos(angle*Math.PI/180.0),0,-Math.sin(angle*Math.PI/180.0),0,
                    0,1,0,0,
                    +Math.sin(angle*Math.PI/180.0),0,+Math.cos(angle*Math.PI/180.0),0,
                    0,0,0,1];
                uMVIdent = MatrixMul(uMVIdent, uMVRotY);
            }

            // Give coordinates based or orbited object
            X = Objects[Objects[i][9]][10];
            Y = Objects[Objects[i][9]][11];
            Z = Objects[Objects[i][9]][12];
            uMVCoord = [
                1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                X,Y,Z,1];
            uMVIdent = MatrixMul(uMVIdent, uMVCoord);

            // Apply coordinates
            X = Objects[i][0];
            Y = Objects[i][1];
            Z = Objects[i][2];
            uMVCoord = [
                1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                X,Y,Z,1];
            uMVIdent = MatrixMul(uMVIdent, uMVCoord);
        }

        ObjectModels[i] = uMVIdent;
    }

    //Render Scene
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); 
    gl.clearColor(10/255, 10/255, 50/255, 1.0); //Wyczyszczenie obrazu kolorem czerwonym
    gl.clearDepth(1.0);             //Wyczyścienie bufora głebi najdalszym planem
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgram)   //Użycie przygotowanego programu shaderowego
    
    gl.enable(gl.DEPTH_TEST);           // Włączenie testu głębi - obiekty bliższe mają przykrywać obiekty dalsze
    gl.depthFunc(gl.LEQUAL);            // 
    
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uPMatrix"), false, new Float32Array(uPMatrix)); //Wgranie macierzy kamery do pamięci karty graficznej
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMVMatrix"), false, new Float32Array(uMVMatrix));
    
    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexPosition"));  //Przekazanie położenia
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexPosition"), vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexColor"));  //Przekazanie kolorów
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexColor"), vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexCoords"));  //Pass the geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordsBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexCoords"), vertexCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexNormal"));  //Przekazywanie wektorów normalnych
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexNormal"), vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    //gl.bindTexture(gl.TEXTURE_2D, texturesBuffer[15]);
    //gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
    
    //gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numItems*vertexPositionBuffer.itemSize);

    for(let i = 0; i < ObjectModels.length; i++) {
        let ViewModel = MatrixMul(ObjectModels[i], uMVMatrix);
        gl.bindTexture(gl.TEXTURE_2D, texturesBuffer[Objects[i][8]]);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMVMatrix"), false, new Float32Array(ViewModel));
        gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numItems*vertexPositionBuffer.itemSize);
    }
   
    setTimeout(Tick,5);
}

function HandleKeyEvent(e) {
    if(e.keyCode==87) { //W - ruch do przodu
        let xAxis = [uMVMatrix[0],uMVMatrix[4],uMVMatrix[ 8]];
        let yAxis = [uMVMatrix[1],uMVMatrix[5],uMVMatrix[ 9]];
        let zAxis = [uMVMatrix[2],uMVMatrix[6],uMVMatrix[10]];
        zAxis = [stepSize*zAxis[0],stepSize*zAxis[1],stepSize*zAxis[2]];
        //Macierz 
        const translationZAxis = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        zAxis[0],zAxis[1],zAxis[2],1.0
        ];
        uMVMatrix = MatrixMul(uMVMatrix,translationZAxis);
    }
    if(e.keyCode==83) { //S - ruch w tył
        let xAxis = [uMVMatrix[0],uMVMatrix[4],uMVMatrix[ 8]];
        let yAxis = [uMVMatrix[1],uMVMatrix[5],uMVMatrix[ 9]];
        let zAxis = [uMVMatrix[2],uMVMatrix[6],uMVMatrix[10]];
        zAxis = [stepSizeRev*zAxis[0],stepSizeRev*zAxis[1],stepSizeRev*zAxis[2]];
        const translationZAxis = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        zAxis[0],zAxis[1],zAxis[2],1.0
        ];
        uMVMatrix = MatrixMul(uMVMatrix,translationZAxis);
    }

    if(e.keyCode==65) { // A - ruch w lewo
        let xAxis = [uMVMatrix[0],uMVMatrix[4],uMVMatrix[ 8]];
        let yAxis = [uMVMatrix[1],uMVMatrix[5],uMVMatrix[ 9]];
        let zAxis = [uMVMatrix[2],uMVMatrix[6],uMVMatrix[10]];
        xAxis = [stepSize*xAxis[0],stepSize*xAxis[1],stepSize*xAxis[2]];
        const translationXAxis = [
        1.0,0.0,0.0,0.0,
        0.0,1.0,0.0,0.0,
        0.0,0.0,1.0,0.0,
        xAxis[0],xAxis[1],xAxis[2],1.0
        ];
        uMVMatrix = MatrixMul(uMVMatrix,translationXAxis);
    }
    if(e.keyCode==68) { // D - ruch w prawo
        let xAxis = [uMVMatrix[0],uMVMatrix[4],uMVMatrix[ 8]];
        let yAxis = [uMVMatrix[1],uMVMatrix[5],uMVMatrix[ 9]];
        let zAxis = [uMVMatrix[2],uMVMatrix[6],uMVMatrix[10]];
        xAxis = [stepSizeRev*xAxis[0],stepSizeRev*xAxis[1],stepSizeRev*xAxis[2]];
        const translationXAxis = [
        1.0,0.0,0.0,0.0,
        0.0,1.0,0.0,0.0,
        0.0,0.0,1.0,0.0,
        xAxis[0],xAxis[1],xAxis[2],1.0
        ];
        uMVMatrix = MatrixMul(uMVMatrix,translationXAxis);
    }
    if(e.keyCode==82) { // R - ruch w góre
        let xAxis = [uMVMatrix[0],uMVMatrix[4],uMVMatrix[ 8]];
        let yAxis = [uMVMatrix[1],uMVMatrix[5],uMVMatrix[ 9]];
        let zAxis = [uMVMatrix[2],uMVMatrix[6],uMVMatrix[10]];
        yAxis = [stepSizeRev*yAxis[0],stepSizeRev*yAxis[1],stepSizeRev*yAxis[2]];
        const translationYAxis = [
        1.0,0.0,0.0,0.0,
        0.0,1.0,0.0,0.0,
        0.0,0.0,1.0,0.0,
        yAxis[0],yAxis[1],yAxis[2],1.0
        ];
        uMVMatrix = MatrixMul(uMVMatrix,translationYAxis);
    }
    if(e.keyCode==70) { // F - ruch w dół
        let xAxis = [uMVMatrix[0],uMVMatrix[4],uMVMatrix[ 8]];
        let yAxis = [uMVMatrix[1],uMVMatrix[5],uMVMatrix[ 9]];
        let zAxis = [uMVMatrix[2],uMVMatrix[6],uMVMatrix[10]];
        yAxis = [stepSize*yAxis[0],stepSize*yAxis[1],stepSize*yAxis[2]];
        const translationYAxis = [
        1.0,0.0,0.0,0.0,
        0.0,1.0,0.0,0.0,
        0.0,0.0,1.0,0.0,
        yAxis[0],yAxis[1],yAxis[2],1.0
        ];
        uMVMatrix = MatrixMul(uMVMatrix,translationYAxis);
    }
    if(e.keyCode==69) { // E - obrot w prawo
        angleY=angleY + stepAngleSize;
        let rotationYAxis = [
        +Math.cos(stepAngleSize*Math.PI/180.0),0,-Math.sin(stepAngleSize*Math.PI/180.0),0,
        0,1,0,0,
        +Math.sin(stepAngleSize*Math.PI/180.0),0,+Math.cos(stepAngleSize*Math.PI/180.0),0,
        0,0,0,1
        ];
        uMVMatrix = MatrixMul(uMVMatrix,rotationYAxis);
    }
    if(e.keyCode==81) { // Q - obrot w lewo
        angleY = angleY + stepAngleSizeRev;
        let rotationYAxis = [
        +Math.cos(stepAngleSizeRev*Math.PI/180.0),0,-Math.sin(stepAngleSizeRev*Math.PI/180.0),0,
        0,1,0,0,
        +Math.sin(stepAngleSizeRev*Math.PI/180.0),0,+Math.cos(stepAngleSizeRev*Math.PI/180.0),0,
        0,0,0,1
        ];
        uMVMatrix = MatrixMul(uMVMatrix,rotationYAxis);
    }
    if(e.keyCode==90) { // Z - obrot w góre
        angleX=angleX + stepAngleSize;
        let rotationXAxis = [
        1,0,0,0,
        0,+Math.cos(stepAngleSize*Math.PI/180.0),-Math.sin(stepAngleSize*Math.PI/180.0),0,
        0,+Math.sin(stepAngleSize*Math.PI/180.0),+Math.cos(stepAngleSize*Math.PI/180.0),0,
        0,0,0,1
        ];
        uMVMatrix = MatrixMul(uMVMatrix,rotationXAxis);
    }
    if(e.keyCode==88) { // X - obrót w dół
        angleX = angleX + stepAngleSizeRev;
        let rotationXAxis = [
        1,0,0,0,
        0,+Math.cos(stepAngleSizeRev*Math.PI/180.0),-Math.sin(stepAngleSizeRev*Math.PI/180.0),0,
        0,+Math.sin(stepAngleSizeRev*Math.PI/180.0),+Math.cos(stepAngleSizeRev*Math.PI/180.0),0,
        0,0,0,1
        ];
        uMVMatrix = MatrixMul(uMVMatrix,rotationXAxis);
    }
    //alert(e.keyCode);
}