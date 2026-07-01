# Earth texture sources

Real satellite imagery — used for the photoreal surface of the descent design.

| File | Source | License | Resolution |
|------|--------|---------|------------|
| `earth_day.jpg` | [NASA Visible Earth — Blue Marble Next Generation (Apr 2004)](https://visibleearth.nasa.gov/images/74218) | Public domain (NASA) | 5400×2700 |
| `earth_night.jpg` | [NASA Visible Earth — Earth's City Lights](https://visibleearth.nasa.gov/images/55167) | Public domain (NASA) | 2400×1200 |
| `earth_normal.jpg` | [three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets) (NASA-derived topography normal) | MIT (three.js) | 2048×1024 |
| `earth_spec.jpg` | three.js examples (ocean/land specular mask) | MIT (three.js) | 2048×1024 |
| `earth_clouds.png` | three.js examples (cloud cover + alpha) | MIT (three.js) | 1024×512 |

NASA imagery is public domain and requires no attribution; credited here as good practice.
All maps are equirectangular (lon/lat) — sampled in the shader from the object-space normal.
