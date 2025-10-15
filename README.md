# A experiment with shaders from shaderToy, and three.js
I designed it so that it could maybe become my 404 page for my portfolio.

- Manipulated the shaders with your mouse.
- Add or remove effects with the 'effect 1' & 'effect 2' button

## I used a shader from shaderToy:
This was the original vertexshader
 ```
precision highp float;

uniform vec2      iResolution;  // viewport resolution (in pixels)
uniform float     iTime;        // shader playback time (in seconds)
uniform sampler2D iChannel0;    // The scene texture from the first pass

varying vec2 vUv; // The UV coordinates from the vertex shader

#define NOISE_LEVEL 0.25 //add slider
#define DARKEN_FACTOR 0.0 //add slider

#define DENOMINATOR vec2(213, 5.53) //add 2 sliders
#define NEG_X vec2(-1.0, 1.0) //add 2 sliders
#define NEG_Y vec2(1.0, -1.0) //add 2 sliders

#define GLITCH_OFFSET_1 vec2(32.05, 236.0) //add 2 sliders
#define GLITCH_OFFSET_2 vec2(-62.05, -36.0)//add 2 sliders

float rand(vec2 co)
{
	return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453); //add sliders
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = vUv;
    
    // Scanline desync
	if (mod(iTime, 2.0) > 1.9) //should be toggled with a button
		uv.x += cos(iTime * 10.0 + uv.y * 1000.0) * 0.01; //should be moving with iTime + extra with slider
    
    // Pixelate glitch 1
    if (mod(iTime, 4.0) > 3.0) //should be toggled with a button
		uv = floor(uv * 32.0) / 32.0; //should be moving with iTime + extra with slider

    // Pixelate glitch 2
	if (mod(iTime, 5.0) > 3.75) //should be toggled with a button
    	uv += 1.0 / 64.0 * (2.0 * vec2(
            rand(floor(uv * 32.0) + GLITCH_OFFSET_1), //should be moving with iTime + extra with slider
            rand(floor(uv.y * 32.0) + GLITCH_OFFSET_2)) - 1.0); //should be moving with iTime + extra with slider

	fragColor = texture(iChannel0, uv);
    fragColor.rgb
        += NOISE_LEVEL
        * vec3(rand(iTime + fragCoord / DENOMINATOR * NEG_X),
               rand(iTime - fragCoord / DENOMINATOR * NEG_Y),
               rand(iTime + fragCoord / DENOMINATOR))
        - DARKEN_FACTOR;
}

    void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
    }
 ```
