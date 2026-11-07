import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const WORK_NODES_PATH = resolve(__dirname, 'src/data/workNodes.json')
const WORK_SCREENS_DIR = resolve(__dirname, 'public/work-screens')
const LOCATION_NOTES_PATH = resolve(__dirname, 'src/data/locationNotes.json')
const LOCATION_DETAILS_PATH = resolve(__dirname, 'src/data/locationDetails.json')
const LOCATION_IMAGES_DIR = resolve(__dirname, 'public/location-images')
const LOCATIONS_GEOJSON_PATH = resolve(__dirname, 'public/my-locations.geojson')
// Dev-only stand-in for the Blob store behind /api/goals. Git-ignored: it
// is scratch, not content — the real edits live in Blob in production and
// the originals live in src/v5/notes.js.
const GOALS_DEV_PATH = resolve(__dirname, 'node_modules/.cache/v5-goals.json')

const sanitize = (name) =>
  String(name || 'screen')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'screen'

const readJsonBody = async (req) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

// Dev-only middleware: lets the admin (localhost) persist work-page state
// (screens + nodes) directly to the source JSON and upload screen images to
// public/, so changes are committed to git and shipped with the build.
const workNodesPlugin = () => ({
  name: 'work-nodes-writer',
  apply: 'serve',
  configureServer(server) {
    // Persist node + screens metadata
    server.middlewares.use('/__work-nodes', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end('Method Not Allowed')
        return
      }
      try {
        const data = await readJsonBody(req)
        await writeFile(WORK_NODES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end('{"ok":true}')
      } catch (err) {
        res.statusCode = 400
        res.end(`Bad Request: ${err.message}`)
      }
    })

    // Persist per-location note positions + text for the background map.
    server.middlewares.use('/__location-notes', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end('Method Not Allowed')
        return
      }
      try {
        const data = await readJsonBody(req)
        await writeFile(LOCATION_NOTES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end('{"ok":true}')
      } catch (err) {
        res.statusCode = 400
        res.end(`Bad Request: ${err.message}`)
      }
    })

    // Persist editable per-location content (title, subtitle, description,
    // image list) for the focused background map.
    server.middlewares.use('/__location-details', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end('Method Not Allowed')
        return
      }
      try {
        const data = await readJsonBody(req)
        await writeFile(LOCATION_DETAILS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end('{"ok":true}')
      } catch (err) {
        res.statusCode = 400
        res.end(`Bad Request: ${err.message}`)
      }
    })

    // Persist the marker geojson so admins can move pins (e.g. via the
    // edit-address flow) and have the change saved to disk.
    server.middlewares.use('/__locations-geojson', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end('Method Not Allowed')
        return
      }
      try {
        const data = await readJsonBody(req)
        await writeFile(LOCATIONS_GEOJSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8')
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end('{"ok":true}')
      } catch (err) {
        res.statusCode = 400
        res.end(`Bad Request: ${err.message}`)
      }
    })

    // Save admin-uploaded images for individual map locations into
    // public/location-images/ and return the served path.
    server.middlewares.use('/__location-upload', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end('Method Not Allowed')
        return
      }
      try {
        const { name, data } = await readJsonBody(req)
        if (!data) throw new Error('missing data')
        const safe = sanitize(name)
        const filename = `${Date.now()}_${safe}`
        const dest = resolve(LOCATION_IMAGES_DIR, filename)
        await mkdir(dirname(dest), { recursive: true })
        await writeFile(dest, Buffer.from(data, 'base64'))
        const src = `/location-images/${filename}`
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, src }))
      } catch (err) {
        res.statusCode = 400
        res.end(`Bad Request: ${err.message}`)
      }
    })

    // /api/goals, locally. In production this is api/goals.js on Vercel,
    // backed by Blob; `vite dev` serves no functions, so the same two routes
    // are reimplemented here over a JSON file. Deliberately without the rate
    // limiting and the admin secret: there is one visitor and it is you.
    server.middlewares.use('/api/goals', async (req, res) => {
      const send = (code, body) => {
        res.statusCode = code
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
      }

      const load = async () => {
        try {
          const { readFile } = await import('node:fs/promises')
          return JSON.parse(await readFile(GOALS_DEV_PATH, 'utf8'))
        } catch {
          return { body: null, at: null, history: [] }
        }
      }

      if (req.method === 'GET') {
        const s = await load()
        // No secret locally, so the log always comes back — scripts/goals.mjs
        // can be pointed here with GOALS_URL and behave the same.
        return send(200, { body: s.body, at: s.at, history: s.history || [] })
      }

      if (req.method === 'POST') {
        try {
          const { body, clear } = await readJsonBody(req)
          const state = await load()
          state.history = state.history || []
          if (clear) {
            state.body = null
            state.at = null
          } else {
            const text = String(body ?? '')
              .split('\n')
              .map((l) => l.replace(/[^\S\n]+/g, ' ').trim())
              .join('\n')
              .trim()
            if (!text) return send(400, { error: 'nothing written' })
            state.history = [{ body: text, at: Date.now() }, ...state.history].slice(0, 40)
            state.body = text
            state.at = Date.now()
          }
          await mkdir(dirname(GOALS_DEV_PATH), { recursive: true })
          await writeFile(GOALS_DEV_PATH, JSON.stringify(state, null, 2), 'utf8')
          return send(200, { ok: true, body: state.body, at: state.at })
        } catch (err) {
          return send(400, { error: err.message })
        }
      }

      res.statusCode = 405
      res.end('Method Not Allowed')
    })

    // Save uploaded screen images into public/work-screens/
    server.middlewares.use('/__work-upload', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end('Method Not Allowed')
        return
      }
      try {
        const { name, data } = await readJsonBody(req)
        if (!data) throw new Error('missing data')
        const safe = sanitize(name)
        const filename = `${Date.now()}_${safe}`
        const dest = resolve(WORK_SCREENS_DIR, filename)
        await mkdir(dirname(dest), { recursive: true })
        await writeFile(dest, Buffer.from(data, 'base64'))
        const src = `/work-screens/${filename}`
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, src }))
      } catch (err) {
        res.statusCode = 400
        res.end(`Bad Request: ${err.message}`)
      }
    })
  },
})

export default defineConfig({
  plugins: [react(), workNodesPlugin()],
  server: {
    port: 3000,
    open: true,
  },
})
