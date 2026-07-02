# Solar journey texture sources

Real planetary maps for the photoreal bodies in this design.
The Sun and the black-hole accretion disk stay procedural (shader) by design —
no real map exists for a stylized star/singularity at this scale.

## Planet surfaces — Solar System Scope

All eight planet albedo maps are from **[Solar System Scope](https://www.solarsystemscope.com/textures/)**,
licensed **CC BY 4.0**. Because this portfolio is publicly hosted, the licence
requires a visible credit — see the gallery footer on the landing page.

| File | Body | Source | Resolution |
|------|------|--------|------------|
| `mercury.jpg` | Mercury | Solar System Scope (CC BY 4.0) | 2048×1024 |
| `venus_atmosphere.jpg` | Venus (cloud top) | Solar System Scope (CC BY 4.0) | 2048×1024 |
| `earth_daymap.jpg` | Earth | Solar System Scope (CC BY 4.0) | 2048×1024 |
| `mars.jpg` | Mars | Solar System Scope (CC BY 4.0) | 2048×1024 |
| `jupiter.jpg` | Jupiter | Solar System Scope (CC BY 4.0) | 2048×1024 |
| `saturn.jpg` | Saturn | Solar System Scope (CC BY 4.0) | 2048×1024 |
| `uranus.jpg` | Uranus | Solar System Scope (CC BY 4.0) | 2048×1024 |
| `neptune.jpg` | Neptune | Solar System Scope (CC BY 4.0) | 2048×1024 |

## Saturn ring

| File | Source | License | Resolution |
|------|--------|---------|------------|
| `saturn_ring_color.jpg` | Solar System Scope (CC BY 4.0) | CC BY 4.0 | 915×64 |
| `saturn_ring_alpha.gif` | Solar System Scope (CC BY 4.0) | CC BY 4.0 | 915×64 |

The ring maps are 1D radial profiles (color + opacity) sampled across the ring
geometry's radius, reproducing the Cassini division and the A/B/C bands.

All planet maps are equirectangular (lon/lat) — sampled in the shader from the
object-space normal, so the geometry's own UVs and seams are irrelevant.

**Attribution string (also shown in the gallery footer):**
> Planet & ring textures © Solar System Scope (solarsystemscope.com), CC BY 4.0.

- `earth_night.jpg`, `earth_clouds.png` — copied from designs/21-earth-descent/textures/ (NASA Black Marble / cloud layer, public domain — see that folder's SOURCES.md for provenance).
