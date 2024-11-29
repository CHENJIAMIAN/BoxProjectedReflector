import * as THREE from 'three'

// --- Box Projected Env Map ---
const worldposReplace = /* glsl */ `
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
  vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
  #ifdef BOX_PROJECTED_ENV_MAP
    vWorldPosition = worldPosition.xyz;
  #endif
#endif
`

const boxProjectDefinitions = /*glsl */ `
#ifdef BOX_PROJECTED_ENV_MAP
  uniform vec3 envMapSize;
  uniform vec3 envMapPosition;
  varying vec3 vWorldPosition;
    
  vec3 parallaxCorrectNormal( vec3 v, vec3 cubeSize, vec3 cubePos ) {
    vec3 nDir = normalize( v );
    vec3 rbmax = ( .5 * cubeSize + cubePos - vWorldPosition ) / nDir;
    vec3 rbmin = ( -.5 * cubeSize + cubePos - vWorldPosition ) / nDir;
    vec3 rbminmax;
    rbminmax.x = ( nDir.x > 0. ) ? rbmax.x : rbmin.x;
    rbminmax.y = ( nDir.y > 0. ) ? rbmax.y : rbmin.y;
    rbminmax.z = ( nDir.z > 0. ) ? rbmax.z : rbmin.z;
    float correction = min( min( rbminmax.x, rbminmax.y ), rbminmax.z );
    vec3 boxIntersection = vWorldPosition + nDir * correction;    
    return boxIntersection - cubePos;
  }
#endif
`

const getIBLIrradiance_patch = /* glsl */ `
#ifdef BOX_PROJECTED_ENV_MAP
  worldNormal = parallaxCorrectNormal( worldNormal, envMapSize, envMapPosition );
#endif
`

const getIBLRadiance_patch = /* glsl */ `
#ifdef BOX_PROJECTED_ENV_MAP
  reflectVec = parallaxCorrectNormal( reflectVec, envMapSize, envMapPosition );
#endif
`

function boxProjectedEnvMap (shader, envMapPosition, envMapSize) {
    shader.defines = shader.defines || {}
    shader.defines.BOX_PROJECTED_ENV_MAP = true
    shader.uniforms = shader.uniforms || {}
    shader.uniforms.envMapPosition = { value: envMapPosition }
    shader.uniforms.envMapSize = { value: envMapSize }

    shader.vertexShader = `
    varying vec3 vWorldPosition;
    ${shader.vertexShader.replace('#include <worldpos_vertex>', worldposReplace)}`

    shader.fragmentShader = `
    ${boxProjectDefinitions}
    ${shader.fragmentShader
        .replace('#include <envmap_physical_pars_fragment>', THREE.ShaderChunk.envmap_physical_pars_fragment)
        .replace(
            'vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );',
            `vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
            ${getIBLIrradiance_patch}
            `
        )
        .replace(
            'reflectVec = inverseTransformDirection( reflectVec, viewMatrix );',
            `reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
            ${getIBLRadiance_patch}
            `
        )}`
}

function useBoxProjectedEnv (material, position, size) {
    material.onBeforeCompile = (shader) => {
        boxProjectedEnvMap(shader, position, size)
    }
    material.customProgramCacheKey = () => JSON.stringify(position.toArray()) + JSON.stringify(size.toArray())
    material.needsUpdate = true
}

export { useBoxProjectedEnv }