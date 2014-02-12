
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("visionmedia-page.js/index.js", Function("exports, require, module",
"\n\
;(function(){\n\
\n\
  /**\n\
   * Perform initial dispatch.\n\
   */\n\
\n\
  var dispatch = true;\n\
\n\
  /**\n\
   * Base path.\n\
   */\n\
\n\
  var base = '';\n\
\n\
  /**\n\
   * Running flag.\n\
   */\n\
\n\
  var running;\n\
\n\
  /**\n\
   * Register `path` with callback `fn()`,\n\
   * or route `path`, or `page.start()`.\n\
   *\n\
   *   page(fn);\n\
   *   page('*', fn);\n\
   *   page('/user/:id', load, user);\n\
   *   page('/user/' + user.id, { some: 'thing' });\n\
   *   page('/user/' + user.id);\n\
   *   page();\n\
   *\n\
   * @param {String|Function} path\n\
   * @param {Function} fn...\n\
   * @api public\n\
   */\n\
\n\
  function page(path, fn) {\n\
    // <callback>\n\
    if ('function' == typeof path) {\n\
      return page('*', path);\n\
    }\n\
\n\
    // route <path> to <callback ...>\n\
    if ('function' == typeof fn) {\n\
      var route = new Route(path);\n\
      for (var i = 1; i < arguments.length; ++i) {\n\
        page.callbacks.push(route.middleware(arguments[i]));\n\
      }\n\
    // show <path> with [state]\n\
    } else if ('string' == typeof path) {\n\
      page.show(path, fn);\n\
    // start [options]\n\
    } else {\n\
      page.start(path);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Callback functions.\n\
   */\n\
\n\
  page.callbacks = [];\n\
\n\
  /**\n\
   * Get or set basepath to `path`.\n\
   *\n\
   * @param {String} path\n\
   * @api public\n\
   */\n\
\n\
  page.base = function(path){\n\
    if (0 == arguments.length) return base;\n\
    base = path;\n\
  };\n\
\n\
  /**\n\
   * Bind with the given `options`.\n\
   *\n\
   * Options:\n\
   *\n\
   *    - `click` bind to click events [true]\n\
   *    - `popstate` bind to popstate [true]\n\
   *    - `dispatch` perform initial dispatch [true]\n\
   *\n\
   * @param {Object} options\n\
   * @api public\n\
   */\n\
\n\
  page.start = function(options){\n\
    options = options || {};\n\
    if (running) return;\n\
    running = true;\n\
    if (false === options.dispatch) dispatch = false;\n\
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);\n\
    if (false !== options.click) window.addEventListener('click', onclick, false);\n\
    if (!dispatch) return;\n\
    var url = location.pathname + location.search + location.hash;\n\
    page.replace(url, null, true, dispatch);\n\
  };\n\
\n\
  /**\n\
   * Unbind click and popstate event handlers.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  page.stop = function(){\n\
    running = false;\n\
    removeEventListener('click', onclick, false);\n\
    removeEventListener('popstate', onpopstate, false);\n\
  };\n\
\n\
  /**\n\
   * Show `path` with optional `state` object.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @param {Boolean} dispatch\n\
   * @return {Context}\n\
   * @api public\n\
   */\n\
\n\
  page.show = function(path, state, dispatch){\n\
    var ctx = new Context(path, state);\n\
    if (false !== dispatch) page.dispatch(ctx);\n\
    if (!ctx.unhandled) ctx.pushState();\n\
    return ctx;\n\
  };\n\
\n\
  /**\n\
   * Replace `path` with optional `state` object.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @return {Context}\n\
   * @api public\n\
   */\n\
\n\
  page.replace = function(path, state, init, dispatch){\n\
    var ctx = new Context(path, state);\n\
    ctx.init = init;\n\
    if (null == dispatch) dispatch = true;\n\
    if (dispatch) page.dispatch(ctx);\n\
    ctx.save();\n\
    return ctx;\n\
  };\n\
\n\
  /**\n\
   * Dispatch the given `ctx`.\n\
   *\n\
   * @param {Object} ctx\n\
   * @api private\n\
   */\n\
\n\
  page.dispatch = function(ctx){\n\
    var i = 0;\n\
\n\
    function next() {\n\
      var fn = page.callbacks[i++];\n\
      if (!fn) return unhandled(ctx);\n\
      fn(ctx, next);\n\
    }\n\
\n\
    next();\n\
  };\n\
\n\
  /**\n\
   * Unhandled `ctx`. When it's not the initial\n\
   * popstate then redirect. If you wish to handle\n\
   * 404s on your own use `page('*', callback)`.\n\
   *\n\
   * @param {Context} ctx\n\
   * @api private\n\
   */\n\
\n\
  function unhandled(ctx) {\n\
    var current = window.location.pathname + window.location.search;\n\
    if (current == ctx.canonicalPath) return;\n\
    page.stop();\n\
    ctx.unhandled = true;\n\
    window.location = ctx.canonicalPath;\n\
  }\n\
\n\
  /**\n\
   * Initialize a new \"request\" `Context`\n\
   * with the given `path` and optional initial `state`.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @api public\n\
   */\n\
\n\
  function Context(path, state) {\n\
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;\n\
    var i = path.indexOf('?');\n\
\n\
    this.canonicalPath = path;\n\
    this.path = path.replace(base, '') || '/';\n\
\n\
    this.title = document.title;\n\
    this.state = state || {};\n\
    this.state.path = path;\n\
    this.querystring = ~i ? path.slice(i + 1) : '';\n\
    this.pathname = ~i ? path.slice(0, i) : path;\n\
    this.params = [];\n\
\n\
    // fragment\n\
    this.hash = '';\n\
    if (!~this.path.indexOf('#')) return;\n\
    var parts = this.path.split('#');\n\
    this.path = parts[0];\n\
    this.hash = parts[1] || '';\n\
    this.querystring = this.querystring.split('#')[0];\n\
  }\n\
\n\
  /**\n\
   * Expose `Context`.\n\
   */\n\
\n\
  page.Context = Context;\n\
\n\
  /**\n\
   * Push state.\n\
   *\n\
   * @api private\n\
   */\n\
\n\
  Context.prototype.pushState = function(){\n\
    history.pushState(this.state, this.title, this.canonicalPath);\n\
  };\n\
\n\
  /**\n\
   * Save the context state.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  Context.prototype.save = function(){\n\
    history.replaceState(this.state, this.title, this.canonicalPath);\n\
  };\n\
\n\
  /**\n\
   * Initialize `Route` with the given HTTP `path`,\n\
   * and an array of `callbacks` and `options`.\n\
   *\n\
   * Options:\n\
   *\n\
   *   - `sensitive`    enable case-sensitive routes\n\
   *   - `strict`       enable strict matching for trailing slashes\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} options.\n\
   * @api private\n\
   */\n\
\n\
  function Route(path, options) {\n\
    options = options || {};\n\
    this.path = path;\n\
    this.method = 'GET';\n\
    this.regexp = pathtoRegexp(path\n\
      , this.keys = []\n\
      , options.sensitive\n\
      , options.strict);\n\
  }\n\
\n\
  /**\n\
   * Expose `Route`.\n\
   */\n\
\n\
  page.Route = Route;\n\
\n\
  /**\n\
   * Return route middleware with\n\
   * the given callback `fn()`.\n\
   *\n\
   * @param {Function} fn\n\
   * @return {Function}\n\
   * @api public\n\
   */\n\
\n\
  Route.prototype.middleware = function(fn){\n\
    var self = this;\n\
    return function(ctx, next){\n\
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);\n\
      next();\n\
    };\n\
  };\n\
\n\
  /**\n\
   * Check if this route matches `path`, if so\n\
   * populate `params`.\n\
   *\n\
   * @param {String} path\n\
   * @param {Array} params\n\
   * @return {Boolean}\n\
   * @api private\n\
   */\n\
\n\
  Route.prototype.match = function(path, params){\n\
    var keys = this.keys\n\
      , qsIndex = path.indexOf('?')\n\
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path\n\
      , m = this.regexp.exec(pathname);\n\
\n\
    if (!m) return false;\n\
\n\
    for (var i = 1, len = m.length; i < len; ++i) {\n\
      var key = keys[i - 1];\n\
\n\
      var val = 'string' == typeof m[i]\n\
        ? decodeURIComponent(m[i])\n\
        : m[i];\n\
\n\
      if (key) {\n\
        params[key.name] = undefined !== params[key.name]\n\
          ? params[key.name]\n\
          : val;\n\
      } else {\n\
        params.push(val);\n\
      }\n\
    }\n\
\n\
    return true;\n\
  };\n\
\n\
  /**\n\
   * Normalize the given path string,\n\
   * returning a regular expression.\n\
   *\n\
   * An empty array should be passed,\n\
   * which will contain the placeholder\n\
   * key names. For example \"/user/:id\" will\n\
   * then contain [\"id\"].\n\
   *\n\
   * @param  {String|RegExp|Array} path\n\
   * @param  {Array} keys\n\
   * @param  {Boolean} sensitive\n\
   * @param  {Boolean} strict\n\
   * @return {RegExp}\n\
   * @api private\n\
   */\n\
\n\
  function pathtoRegexp(path, keys, sensitive, strict) {\n\
    if (path instanceof RegExp) return path;\n\
    if (path instanceof Array) path = '(' + path.join('|') + ')';\n\
    path = path\n\
      .concat(strict ? '' : '/?')\n\
      .replace(/\\/\\(/g, '(?:/')\n\
      .replace(/(\\/)?(\\.)?:(\\w+)(?:(\\(.*?\\)))?(\\?)?/g, function(_, slash, format, key, capture, optional){\n\
        keys.push({ name: key, optional: !! optional });\n\
        slash = slash || '';\n\
        return ''\n\
          + (optional ? '' : slash)\n\
          + '(?:'\n\
          + (optional ? slash : '')\n\
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'\n\
          + (optional || '');\n\
      })\n\
      .replace(/([\\/.])/g, '\\\\$1')\n\
      .replace(/\\*/g, '(.*)');\n\
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');\n\
  }\n\
\n\
  /**\n\
   * Handle \"populate\" events.\n\
   */\n\
\n\
  function onpopstate(e) {\n\
    if (e.state) {\n\
      var path = e.state.path;\n\
      page.replace(path, e.state);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Handle \"click\" events.\n\
   */\n\
\n\
  function onclick(e) {\n\
    if (1 != which(e)) return;\n\
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;\n\
    if (e.defaultPrevented) return;\n\
\n\
    // ensure link\n\
    var el = e.target;\n\
    while (el && 'A' != el.nodeName) el = el.parentNode;\n\
    if (!el || 'A' != el.nodeName) return;\n\
\n\
    // ensure non-hash for the same path\n\
    var link = el.getAttribute('href');\n\
    if (el.pathname == location.pathname && (el.hash || '#' == link)) return;\n\
\n\
    // check target\n\
    if (el.target) return;\n\
\n\
    // x-origin\n\
    if (!sameOrigin(el.href)) return;\n\
\n\
    // rebuild path\n\
    var path = el.pathname + el.search + (el.hash || '');\n\
\n\
    // same page\n\
    var orig = path + el.hash;\n\
\n\
    path = path.replace(base, '');\n\
    if (base && orig == path) return;\n\
\n\
    e.preventDefault();\n\
    page.show(orig);\n\
  }\n\
\n\
  /**\n\
   * Event button.\n\
   */\n\
\n\
  function which(e) {\n\
    e = e || window.event;\n\
    return null == e.which\n\
      ? e.button\n\
      : e.which;\n\
  }\n\
\n\
  /**\n\
   * Check if `href` is the same origin.\n\
   */\n\
\n\
  function sameOrigin(href) {\n\
    var origin = location.protocol + '//' + location.hostname;\n\
    if (location.port) origin += ':' + location.port;\n\
    return 0 == href.indexOf(origin);\n\
  }\n\
\n\
  /**\n\
   * Expose `page`.\n\
   */\n\
\n\
  if ('undefined' == typeof module) {\n\
    window.page = page;\n\
  } else {\n\
    module.exports = page;\n\
  }\n\
\n\
})();\n\
//@ sourceURL=visionmedia-page.js/index.js"
));

require.register("home/index.js", Function("exports, require, module",
"//@ sourceURL=home/index.js"
));
require.register("credits/index.js", Function("exports, require, module",
"//@ sourceURL=credits/index.js"
));
require.register("component-raf/index.js", Function("exports, require, module",
"/**\n\
 * Expose `requestAnimationFrame()`.\n\
 */\n\
\n\
exports = module.exports = window.requestAnimationFrame\n\
  || window.webkitRequestAnimationFrame\n\
  || window.mozRequestAnimationFrame\n\
  || window.oRequestAnimationFrame\n\
  || window.msRequestAnimationFrame\n\
  || fallback;\n\
\n\
/**\n\
 * Fallback implementation.\n\
 */\n\
\n\
var prev = new Date().getTime();\n\
function fallback(fn) {\n\
  var curr = new Date().getTime();\n\
  var ms = Math.max(0, 16 - (curr - prev));\n\
  var req = setTimeout(fn, ms);\n\
  prev = curr;\n\
  return req;\n\
}\n\
\n\
/**\n\
 * Cancel.\n\
 */\n\
\n\
var cancel = window.cancelAnimationFrame\n\
  || window.webkitCancelAnimationFrame\n\
  || window.mozCancelAnimationFrame\n\
  || window.oCancelAnimationFrame\n\
  || window.msCancelAnimationFrame\n\
  || window.clearTimeout;\n\
\n\
exports.cancel = function(id){\n\
  cancel.call(window, id);\n\
};\n\
//@ sourceURL=component-raf/index.js"
));
require.register("map/index.js", Function("exports, require, module",
"var raf = require('raf');\n\
\n\
module.exports = PanoView;\n\
\n\
var isWebGL = function () {\n\
  try {\n\
    return !! window.WebGLRenderingContext\n\
            && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' );\n\
  } catch(e) {\n\
    console.log('WebGL not available starting with CanvasRenderer');\n\
    return false;\n\
  }\n\
};\n\
\n\
function PanoView(){\n\
\n\
  this.time = 0;\n\
\n\
  this.render = this.render.bind(this);\n\
\n\
  this.canvas = document.createElement( 'canvas' );\n\
  this.context = this.canvas.getContext( '2d' );\n\
\n\
  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1100 );\n\
  this.target = new THREE.Vector3( 0, 0, 0 );\n\
\n\
  this.controller = new THREE.FirstPersonControls(this.camera,document);\n\
\n\
  this.scene = new THREE.Scene();\n\
  this.scene.add( this.camera );\n\
\n\
  this.mesh = null;\n\
\n\
  this.init3D();\n\
}\n\
\n\
var p = PanoView.prototype;\n\
\n\
p.init3D = function(){\n\
  this.renderer = isWebGL() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();\n\
  this.renderer.autoClearColor = false;\n\
  this.renderer.setSize( window.innerWidth, window.innerHeight );\n\
\n\
\n\
  this.mesh = new THREE.Mesh(\n\
    new THREE.SphereGeometry( 500, 60, 40 ),\n\
    new THREE.MeshPhongMaterial( { map: new THREE.Texture(), normalMap:new THREE.Texture(), side: THREE.DoubleSide } )\n\
  );\n\
\n\
  this.mesh2 = new THREE.Mesh(\n\
    new THREE.SphereGeometry( 490, 60, 40 ),\n\
    new THREE.MeshPhongMaterial( { map: new THREE.Texture(), side: THREE.DoubleSide, opacity:0.5,transparent:true } )\n\
  );\n\
\n\
  var groundMaskUniforms = {\n\
    texture1: { type: \"t\", value: new THREE.Texture() },\n\
    texture2: { type: \"t\", value: new THREE.Texture() }\n\
  };\n\
\n\
  var params = {\n\
    uniforms:  groundMaskUniforms,\n\
    vertexShader: require('./water_vs.glsl'),\n\
    fragmentShader: require('./water_fs.glsl'),\n\
    side: THREE.DoubleSide,\n\
    transparent:true,\n\
    lights: false\n\
  }\n\
\n\
  var maskMaterial = new THREE.ShaderMaterial(params);\n\
  //maskMaterial.uniforms.map = new THREE.Texture();\n\
\n\
\n\
  this.mesh3 = new THREE.Mesh(\n\
    new THREE.SphereGeometry( 500, 60, 40 ),\n\
    maskMaterial\n\
  );\n\
\n\
  this.scene.add( this.mesh );\n\
  //this.scene.add( this.mesh2 );\n\
  this.scene.add( this.mesh3 );\n\
\n\
\n\
  this.light = new THREE.AmbientLight();\n\
  this.scene.add(this.light);\n\
\n\
  this.controller.handleResize();\n\
\n\
  $('#app')[0].appendChild( this.renderer.domElement );\n\
}\n\
\n\
p.render = function(){\n\
  this.renderer.render( this.scene, this.camera );\n\
  this.controller.update(0.1);\n\
  this.time += 0.01;\n\
\n\
  raf(this.render);\n\
}\n\
//@ sourceURL=map/index.js"
));
require.register("map/water_vs.glsl", Function("exports, require, module",
"module.exports = '// switch on high precision floats\\n\
varying vec4 mPosition;\\n\
varying vec2 vUv;\\n\
uniform float time;\\n\
\\n\
void main() {\\n\
\\n\
  mPosition = modelMatrix * vec4(position,1.0);\\n\
\\n\
  vUv = uv;\\n\
  vec4 mvPosition = viewMatrix * mPosition;\\n\
  gl_Position = projectionMatrix * mvPosition;\\n\
\\n\
}\\n\
';//@ sourceURL=map/water_vs.glsl"
));
require.register("map/water_fs.glsl", Function("exports, require, module",
"module.exports = 'varying vec4 mPosition;\\n\
uniform sampler2D texture1;\\n\
uniform sampler2D texture2;\\n\
uniform float time;\\n\
varying vec2 vUv;\\n\
\\n\
uniform vec3 diffuse;\\n\
uniform vec3 fogColor;\\n\
uniform float fogNear;\\n\
uniform float fogFar;\\n\
\\n\
void main() {\\n\
\\n\
  vec3 diffuseTex1 = texture2D( texture1, vUv ).xyz;\\n\
  vec3 diffuseTex2 = texture2D( texture2, vUv ).xyz;\\n\
  float thres = 1.0-step(0.1,diffuseTex1.b);\\n\
  vec3 waterColor = vec3(1.0);\\n\
\\n\
  gl_FragColor = vec4( mix(waterColor,diffuseTex2,1.0),thres-0.3);\\n\
\\n\
  //float depth = gl_FragCoord.z / gl_FragCoord.w;\\n\
  //float fogFactor = smoothstep( fogNear, fogFar, depth );\\n\
  //gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\\n\
\\n\
}\\n\
';//@ sourceURL=map/water_fs.glsl"
));
require.register("boot/index.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Pano = require('map');\n\
\n\
function init() {\n\
  var self = this;\n\
  var _panoLoader = new GSVPANO.PanoLoader({zoom: 1});\n\
  var _depthLoader = new GSVPANO.PanoDepthLoader();\n\
\n\
  var pano = new Pano();\n\
\n\
  _depthLoader.onDepthLoad = function() {\n\
    var x, y, canvas, context, image, w, h, c,pointer;\n\
\n\
    canvas = document.createElement(\"canvas\");\n\
    context = canvas.getContext('2d');\n\
\n\
    w = this.depthMap.width;\n\
    h = this.depthMap.height;\n\
\n\
    canvas.setAttribute('width', w);\n\
    canvas.setAttribute('height', h);\n\
\n\
    image = context.getImageData(0, 0, w, h);\n\
\n\
    for(y=0; y<h; ++y) {\n\
      for(x=0; x<w; ++x) {\n\
        c = this.depthMap.depthMap[y*w + x] / 50 * 255;\n\
        image.data[4*(y*w + x)    ] = c;\n\
        image.data[4*(y*w + x) + 1] = c;\n\
        image.data[4*(y*w + x) + 2] = c;\n\
        image.data[4*(y*w + x) + 3] = 255;\n\
      }\n\
    }\n\
\n\
    context.putImageData(image, 0, 0);\n\
\n\
    //document.body.appendChild(canvas);\n\
\n\
    //pano.mesh.material.map.image = canvas;\n\
    //pano.mesh.material.map.needsUpdate = true;\n\
\n\
    pano.mesh3.material.uniforms.texture2.value.image = canvas;\n\
    pano.mesh3.material.uniforms.texture2.value.needsUpdate = true;\n\
\n\
    canvas = document.createElement(\"canvas\");\n\
    context = canvas.getContext('2d');\n\
\n\
    w = this.depthMap.width;\n\
    h = this.depthMap.height;\n\
\n\
    canvas.setAttribute('width', w);\n\
    canvas.setAttribute('height', h);\n\
\n\
    image = context.getImageData(0, 0, w, h);\n\
    pointer = 0;\n\
\n\
    var pixelIndex;\n\
\n\
    for(y=0; y<h; ++y) {\n\
      for(x=0; x<w; ++x) {\n\
        pointer += 3;\n\
        pixelIndex = (y*w + (w-x))*4;\n\
        image.data[ pixelIndex ] = (this.normalMap.normalMap[pointer]+1)/2 * 255;\n\
        image.data[pixelIndex + 1] = (this.normalMap.normalMap[pointer+1]+1)/2 * 255;\n\
        image.data[pixelIndex + 2] = (this.normalMap.normalMap[pointer+2]+1)/2 * 255;\n\
        image.data[pixelIndex + 3] = 255;\n\
      }\n\
    }\n\
\n\
    context.putImageData(image, 0, 0);\n\
\n\
    document.body.appendChild(canvas);\n\
\n\
    //pano.mesh2.material.map.image = canvas;\n\
    //pano.mesh2.material.map.needsUpdate = true;\n\
\n\
    pano.mesh3.material.uniforms.texture1.value.image = canvas;\n\
    pano.mesh3.material.uniforms.texture1.value.needsUpdate = true;\n\
\n\
    console.log(pano.mesh3.material.uniforms);\n\
    //pano.mesh.material.normalScale.value = 1;\n\
    //pano.mesh.material.normalMap.needsUpdate = true;\n\
\n\
    pano.render();\n\
  }\n\
\n\
  _panoLoader.onPanoramaLoad = function() {\n\
    //document.body.appendChild(this.canvas);\n\
\n\
    pano.mesh.material.map.image = this.canvas;\n\
    pano.mesh.material.map.needsUpdate = true;\n\
\n\
    _depthLoader.load(this.panoId);\n\
  };\n\
\n\
\n\
\n\
/*\n\
  if (navigator.geolocation) {\n\
    navigator.geolocation.getCurrentPosition(successFunction, errorFunction);\n\
  }\n\
  else {\n\
    _panoLoader.load(new google.maps.LatLng(42.345601, -71.098348));\n\
  }\n\
\n\
  function successFunction(position)\n\
  {\n\
      var lat = position.coords.latitude;\n\
      var lon = position.coords.longitude;\n\
      _panoLoader.load(new google.maps.LatLng(lat,lon));\n\
  }\n\
\n\
  function errorFunction(position)\n\
  {\n\
\n\
    _panoLoader.load(new google.maps.LatLng(40.759101,-73.984406));\n\
  }*/\n\
   _panoLoader.load(new google.maps.LatLng(40.759101,-73.984406));\n\
\n\
\n\
}\n\
\n\
init();\n\
//@ sourceURL=boot/index.js"
));









require.register("home/template.html", Function("exports, require, module",
"module.exports = '<div id=\"home\" class=\"home\">\\n\
  <div class=\"home-header\">\\n\
    <h1 class=\"home-header-title\">Home</h1>\\n\
  </div>\\n\
</div>\\n\
';//@ sourceURL=home/template.html"
));
require.register("credits/template.html", Function("exports, require, module",
"module.exports = '';//@ sourceURL=credits/template.html"
));

require.register("map/template.html", Function("exports, require, module",
"module.exports = '';//@ sourceURL=map/template.html"
));
require.alias("boot/index.js", "mapsdepth/deps/boot/index.js");
require.alias("boot/index.js", "mapsdepth/deps/boot/index.js");
require.alias("boot/index.js", "boot/index.js");

require.alias("visionmedia-page.js/index.js", "boot/deps/page/index.js");


require.alias("home/index.js", "boot/deps/home/index.js");
require.alias("home/index.js", "boot/deps/home/index.js");
require.alias("home/index.js", "home/index.js");
require.alias("credits/index.js", "boot/deps/credits/index.js");
require.alias("credits/index.js", "boot/deps/credits/index.js");
require.alias("credits/index.js", "credits/index.js");
require.alias("map/index.js", "boot/deps/map/index.js");
require.alias("map/index.js", "boot/deps/map/index.js");
require.alias("component-raf/index.js", "map/deps/raf/index.js");

require.alias("map/index.js", "map/index.js");
require.alias("boot/index.js", "boot/index.js");