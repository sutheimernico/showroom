# House walkthrough texture sources

PBR materials for the photoreal surfaces in this design. Each material is a
diffuse + GL-normal + roughness triplet, tiled with per-material `repeat`
tuned to the dominant face's world size (see `pbr()` in `index.html`).

## All maps — Poly Haven

Every texture is from **[Poly Haven](https://polyhaven.com/textures)**, released
under **CC0 1.0** (public domain). No attribution is required; this note exists
for provenance and reproducibility only.

| Material | Surface | Files (`_diff` / `_nor_gl` / `_rough`) | Resolution |
|----------|---------|------------------------------------------|------------|
| `wood_floor_deck` | Interior wood floor | `wood_floor_deck_{diff,nor_gl,rough}_1k.jpg` | 1024×1024 |
| `aerial_grass_rock` | Exterior ground / terrain | `aerial_grass_rock_{diff,nor_gl,rough}_1k.jpg` | 1024×1024 |
| `painted_plaster_wall` | Warm interior walls | `painted_plaster_wall_{diff,nor_gl,rough}_1k.jpg` | 1024×1024 |
| `concrete_floor_02` | Concrete slab / base | `concrete_floor_02_{diff,nor_gl,rough}_1k.jpg` | 1024×1024 |
| `patterned_concrete_pavers_03` | Terrace pavers | `patterned_concrete_pavers_03_{diff,nor_gl,rough}_1k.jpg` | 1024×1024 |

## `grass001` — ambientCG

The lawn ground initially used Poly Haven's `leafy_grass`, which turned out to
be brown leaf litter, not turf. Replaced with
**[ambientCG Grass001](https://ambientcg.com/view?id=Grass001)** (CC0 1.0,
public domain), `1K-JPG` variant, files renamed to the repo convention:

| Material | Surface | Files (`_diff` / `_nor_gl` / `_rough`) | Resolution |
|----------|---------|------------------------------------------|------------|
| `grass001` | Lawn ground | `grass001_{diff,nor_gl,rough}_1k.jpg` | 1024×1024 |

## Conventions

- **Colour space:** diffuse maps are `SRGBColorSpace`; normal and roughness maps
  are `NoColorSpace` (linear data).
- **Normals:** `nor_gl` is the NormalGL (OpenGL/+Y) convention — three.js'
  default for `normalMap`, so no green-channel flip is needed.
- **Warm tint:** `painted_plaster_wall` and `concrete_floor_02` carry a warm
  albedo `color` in the material that multiplies the neutral diffuse map, so the
  golden-hour light keeps its honey cast. See `index.html`.

Download URL pattern (1k JPG):
`https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/<name>/<name>_<map>_1k.jpg`
