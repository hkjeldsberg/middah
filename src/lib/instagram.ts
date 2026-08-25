import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Strict allowlist for Instagram media URLs, mirroring yt-dlp's own InstagramIE
 * pattern: an optional username segment, then p / tv / reel / reels.
 * Only the matched portion is passed on, so nothing user-supplied can leak into
 * the argument list.
 */
const INSTAGRAM_URL =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:(?!share\/)[^/?#]+\/)?(?:p|tv|reels?(?!\/audio\/))\/[A-Za-z0-9_-]+/

/** The app's "Copy link" often yields these; they redirect to a canonical post URL. */
const INSTAGRAM_SHARE_URL = /^https?:\/\/(?:www\.)?instagram\.com\/share\/\S+/

export class ReelError extends Error {}

export interface InstagramMetadata {
  /** The text under the post — yt-dlp calls it `description`, Instagram calls it the caption. */
  description: string
  title: string | null
  uploader: string | null
  webpageUrl: string
}

interface YtDlpJson {
  description?: string | null
  title?: string | null
  uploader?: string | null
  webpage_url?: string | null
  entries?: { description?: string | null }[] | null
}

/** Returns the canonical URL if `raw` is an Instagram post/reel link, otherwise null. */
export function normalizeInstagramUrl(raw: string): string | null {
  const match = raw.trim().match(INSTAGRAM_URL)
  return match ? match[0] : null
}

/**
 * Resolves an instagram.com/share/... link to the post URL it redirects to.
 * yt-dlp rejects share links outright, so they have to be followed first.
 */
async function resolveShareUrl(raw: string): Promise<string | null> {
  try {
    const res = await fetch(raw.trim(), {
      redirect: 'follow',
      headers: {
        // Instagram serves the redirect only to something browser-shaped.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    })
    return normalizeInstagramUrl(res.url)
  } catch {
    return null
  }
}

function resolveYtDlp(): string {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH
  const local = path.join(process.cwd(), '.venv', 'bin', 'yt-dlp')
  if (existsSync(local)) return local
  return 'yt-dlp'
}

function buildArgs(url: string): string[] {
  const args = [
    '--dump-single-json',
    '--skip-download',
    '--no-playlist',
    '--no-warnings',
    // Photo posts carry no video stream. Without this yt-dlp aborts with
    // "There is no video in this post" and we never get to see the caption.
    '--ignore-no-formats-error',
  ]

  // Instagram increasingly requires a logged-in session. Both are optional.
  if (process.env.YTDLP_COOKIES_FROM_BROWSER) {
    args.push('--cookies-from-browser', process.env.YTDLP_COOKIES_FROM_BROWSER)
  } else if (process.env.YTDLP_COOKIES_FILE) {
    args.push('--cookies', process.env.YTDLP_COOKIES_FILE)
  }

  args.push(url)
  return args
}

export async function fetchInstagramMetadata(rawUrl: string): Promise<InstagramMetadata> {
  let url = normalizeInstagramUrl(rawUrl)

  if (!url && INSTAGRAM_SHARE_URL.test(rawUrl.trim())) {
    url = await resolveShareUrl(rawUrl)
    if (!url) {
      throw new ReelError(
        'Klarte ikke å følge delingslenken. Åpne den i nettleseren og kopier adressen derfra.'
      )
    }
  }

  if (!url) {
    throw new ReelError(
      'Ugyldig lenke. Bruk en lenke til et innlegg eller en reel, f.eks. https://www.instagram.com/p/XXXXXXXXX/'
    )
  }

  let stdout: string
  try {
    ;({ stdout } = await execFileAsync(resolveYtDlp(), buildArgs(url), {
      timeout: 60_000,
      maxBuffer: 16 * 1024 * 1024,
    }))
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string; killed?: boolean }

    if (e.code === 'ENOENT') {
      throw new ReelError(
        'Fant ikke yt-dlp. Installer den, eller sett YTDLP_PATH til hvor den ligger.'
      )
    }
    if (e.killed) {
      throw new ReelError('yt-dlp brukte for lang tid. Prøv igjen.')
    }

    const stderr = e.stderr ?? ''
    if (/login|rate-?limit|429|cookies|empty media response/i.test(stderr)) {
      throw new ReelError(
        'Instagram krever innlogging for denne lenken. Sett YTDLP_COOKIES_FROM_BROWSER (f.eks. "chrome") eller YTDLP_COOKIES_FILE.'
      )
    }
    console.error('[instagram] yt-dlp feilet:', stderr || e.message)
    throw new ReelError('Klarte ikke å hente innlegget. Sjekk at lenken er offentlig.')
  }

  let meta: YtDlpJson
  try {
    meta = JSON.parse(stdout) as YtDlpJson
  } catch {
    throw new ReelError('Uventet svar fra yt-dlp.')
  }

  // Carousels come back as a playlist. The caption sits at the top level, but
  // fall back to the entries in case a future extractor version moves it.
  const description = (
    meta.description ??
    meta.entries?.find((e) => e?.description?.trim())?.description ??
    ''
  ).trim()

  if (!description) {
    throw new ReelError(
      'Innlegget har ingen tekst. Oppskriften ligger kanskje i en kommentar — lim den inn under «Lim inn tekst».'
    )
  }

  return {
    description,
    title: meta.title?.trim() || null,
    uploader: meta.uploader?.trim() || null,
    webpageUrl: meta.webpage_url ?? url,
  }
}
