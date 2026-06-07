import initialDetails from './locationDetails.json';

const trgImages = Object.entries(
  import.meta.glob('../assets/trg/*.{png,jpg,jpeg,JPG,JPEG}', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src);

const ccImages = Object.entries(
  import.meta.glob('../assets/cc/*.{png,jpg,jpeg,JPG,JPEG}', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src);

// Locations whose images live in src/assets/ and ship via Vite's bundler get
// merged in alongside any admin-uploaded images stored under /location-images/.
const STATIC_IMAGES = {
  'trg-international': trgImages,
  'utm-career-center': ccImages
};

const mergeDetails = (data) => {
  const out = {};
  for (const [id, entry] of Object.entries(data || {})) {
    const uploaded = Array.isArray(entry?.images) ? entry.images : [];
    const staticImgs = STATIC_IMAGES[id] || [];
    out[id] = {
      ...entry,
      images: [...staticImgs, ...uploaded]
    };
  }
  return out;
};

export const buildLocationDetails = (data) => mergeDetails(data);
export const locationDetails = mergeDetails(initialDetails);
