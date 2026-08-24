import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Strict allowlist for Instagram media URLs. Only the matched portion is passed
 * on to yt-dlp, so nothing user-supplied can leak into the argument list.
 */
const INSTAGRAM_URL = /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p|tv)\/[A-Za-z0-9_-]+/

export class ReelError extends Error {}

export interface ReelMetadata {
  /** The text shown under the reel — yt-dlp calls it `description`, Instagram calls it the caption. */
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
}

/** Returns the canonical URL if `raw` is an Instagram media link, otherwise null. */
export function normalizeReelUrl(raw: string): string | null {
  const match = raw.trim().match(INSTAGRAM_URL)
  return match ? match[0] : null
}

function resolveYtDlp(): string {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH
  const local = path.join(process.cwd(), '.venv', 'bin', 'yt-dlp')
  if (existsSync(local)) return local
  return 'yt-dlp'
}

function buildArgs(url: string): string[] {
  const args = ['--dump-single-json', '--skip-download', '--no-playlist', '--no-warnings']

  // Instagram increasingly requires a logged-in session. Both are optional.
  if (process.env.YTDLP_COOKIES_FROM_BROWSER) {
    args.push('--cookies-from-browser', process.env.YTDLP_COOKIES_FROM_BROWSER)
  } else if (process.env.YTDLP_COOKIES_FILE) {
    args.push('--cookies', process.env.YTDLP_COOKIES_FILE)
  }

  args.push(url)
  return args
}

export async function fetchReelMetadata(rawUrl: string): Promise<ReelMetadata> {
  const url = normalizeReelUrl(rawUrl)
  if (!url) {
    throw new ReelError(
      'Ugyldig lenke. Bruk en Instagram-lenke, f.eks. https://www.instagram.com/reel/XXXXXXXXX/'
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
    if (/login|rate-?limit|429|cookies/i.test(stderr)) {
      throw new ReelError(
        'Instagram krever innlogging for denne lenken. Sett YTDLP_COOKIES_FROM_BROWSER (f.eks. "chrome") eller YTDLP_COOKIES_FILE.'
      )
    }
    console.error('[reel] yt-dlp feilet:', stderr || e.message)
    throw new ReelError('Klarte ikke å hente reelen. Sjekk at lenken er offentlig.')
  }

  let meta: YtDlpJson
  try {
    meta = JSON.parse(stdout) as YtDlpJson
  } catch {
    throw new ReelError('Uventet svar fra yt-dlp.')
  }

  const description = (meta.description ?? '').trim()
  if (!description) {
    throw new ReelError(
      'Reelen har ingen beskrivelse. Oppskriften ligger kanskje i en kommentar — lim den inn manuelt i feltet for instruksjoner.'
    )
  }

  return {
    description,
    title: meta.title?.trim() || null,
    uploader: meta.uploader?.trim() || null,
    webpageUrl: meta.webpage_url ?? url,
  }
}
