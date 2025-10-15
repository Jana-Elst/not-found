precision highp float;

uniform vec2      iResolution;  // viewport resolution (in pixels)
uniform float     iTime;        // shader playback time (in seconds)
uniform sampler2D iChannel0;    // The scene texture from the first pass

uniform float u_noise;
uniform float u_darken;
uniform vec2  u_denominator;
uniform vec2  u_negX;
uniform vec2  u_negY;
uniform vec2  u_glitchOffset1;
uniform vec2  u_glitchOffset2;
uniform vec2  u_randSeeds;
uniform float u_scanline;
uniform float u_yScanline;
uniform float u_pixelate1Size;
uniform float u_pixelate2Size;
uniform float u_pixelate3Size;
uniform bool  u_enableScanline;
uniform bool  u_enablePixelate1;
uniform bool  u_enablePixelate2;

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
	return fract(sin(dot(co.xy, u_randSeeds)) * 43758.5453); //add sliders
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = vUv;
    float movement = sin(iTime);
    
    // Scanline desync
	if (u_enableScanline) //should be toggled with a button
		// uv.x += cos(iTime * 10.0 + uv.y * 1000.0) * u_scanline; //should be moving with iTime + extra with slider
    	uv.x += cos(iTime * (u_scanline*0.05) + uv.y * u_yScanline) * u_scanline; //should be moving with iTime + extra with slider

    
    // Pixelate glitch 1
    if (u_enablePixelate1) //should be toggled with a button
		uv = floor(uv * u_pixelate1Size) / u_pixelate1Size; //should be moving with iTime + extra with slider

    // Pixelate glitch 2
	if (u_enablePixelate2) //should be toggled with a button
    	uv += 1.0 / u_pixelate2Size * (2.0 * vec2(
            rand(floor(uv * u_pixelate3Size) + u_glitchOffset1), //should be moving with iTime + extra with slider
            rand(floor(uv.y * u_pixelate3Size) + u_glitchOffset2)) - 3.0); //should be moving with iTime + extra with slider

	fragColor = texture(iChannel0, uv);
    fragColor.rgb
        += u_noise
        * vec3(rand(iTime + fragCoord / u_denominator * u_negX),
               rand(iTime - fragCoord / u_denominator * u_negY),
               rand(iTime + fragCoord / u_denominator))
        - u_darken;
}

    void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
    }