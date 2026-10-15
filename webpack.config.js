const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const path = require('path');

module.exports = {
  // Use our tiny connector in the site folder as the entry point
  entry: './site/data.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'), // Output the bundle to ./dist/
    publicPath: '',
  },
  
  plugins: [
    // 1. Tell Webpack to use our HTML file in the site folder as the base template
    new HtmlWebpackPlugin({
      template: './site/index.html',
      filename: 'index.html',
      inject: 'body',
    }),
    // 2. Tell Webpack to inline the JS directly into the HTML file
    new HtmlInlineScriptPlugin()
  ],
  
  // We don't need source maps or external files for this portal
  devtool: false, 
};
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('vidContainer');
  const video = document.getElementById('marineVideo');
  
  const brightInput = document.getElementById('toolBrightness');
  const contrastInput = document.getElementById('toolContrast');
  const speedInput = document.getElementById('toolSpeed');
  const sharpenInput = document.getElementById('toolSharpen');

  // --- 1. COLOR & SHARPEN ENHANCEMENTS ---
  function updateFilters() {
    let filterString = `brightness(${brightInput.value}) contrast(${contrastInput.value})`;
    if (sharpenInput.checked) {
      filterString += ` url(#sharpen)`;
    }
    video.style.filter = filterString;
  }

  brightInput.addEventListener('input', updateFilters);
  contrastInput.addEventListener('input', updateFilters);
  sharpenInput.addEventListener('change', updateFilters);

  // --- 2. PLAYBACK SPEED ---
  speedInput.addEventListener('change', (e) => {
    video.playbackRate = parseFloat(e.target.value);
  });

  // --- 3. ZOOM & PAN LOGIC ---
  let scale = 1;
  let panning = false;
  let pointX = 0;
  let pointY = 0;
  let startX = 0;
  let startY = 0;

  function setTransform() {
    video.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
  }

  // Zoom with Mouse Wheel
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = -e.deltaY * 0.005;
    const newScale = Math.min(Math.max(1, scale + zoomFactor), 5); // Max 5x zoom
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (newScale !== scale) {
      pointX = mouseX - (mouseX - pointX) * (newScale / scale);
      pointY = mouseY - (mouseY - pointY) * (newScale / scale);
      scale = newScale;
      
      // Snap back to normal if zoomed all the way out
      if (scale === 1) { pointX = 0; pointY = 0; }
      setTransform();
    }
  });

  // Pan by clicking and dragging
  container.addEventListener('mousedown', (e) => {
    if (scale > 1) {
      e.preventDefault();
      startX = e.clientX - pointX;
      startY = e.clientY - pointY;
      panning = true;
      container.style.cursor = 'grabbing';
    }
  });

  container.addEventListener('mousemove', (e) => {
    if (!panning) return;
    pointX = e.clientX - startX;
    pointY = e.clientY - startY;
    setTransform();
  });

  const stopPanning = () => {
    panning = false;
    container.style.cursor = 'grab';
  };

  container.addEventListener('mouseup', stopPanning);
  container.addEventListener('mouseleave', stopPanning);
});
