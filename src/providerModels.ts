import {requestUrl} from 'obsidian';
import type {ModelInfo, ReasoningEffort} from './copilot';

/** BYOK provider presets (everything except the built-in `github` preset). */
export type ByokProviderPreset = 'openai' | 'azure' | 'anthropic' | 'ollama' | 'foundry-local' | 'other-openai';

export interface FetchProviderModelsParams {
	preset: ByokProviderPreset;
	/** Provider base URL, with or without a trailing slash. */
	baseUrl: string;
	apiKey?: string;
	bearerToken?: string;
}

export type FetchProviderModelsResult =
	| {ok: true; models: ModelInfo[]}
	| {ok: false; error: string};

const VISION_REGEX = /gpt-4o|gpt-4-vision|claude-3|gemini-1\.5|vision|pixtral/i;
const REASONING_REGEX = /\b(o1|o3)\b|o1-|o3-/i;

const ollamaShowCache = new Map<string, Promise<{vision: boolean; tools: boolean}>>();

function toRecordOrNull(value: unknown): Record<string, unknown> | null {
	return (typeof value === 'object' && value !== null && !Array.isArray(value)) ? (value as Record<string, unknown>) : null;
}

function createCapabilities(supportsVision: boolean, supportsReasoning: boolean): ModelInfo['capabilities'] {
	const caps: ModelInfo['capabilities'] = {
		supports: {vision: supportsVision, reasoningEffort: supportsReasoning},
		limits: {max_context_window_tokens: 0},
	};
	if (supportsVision) {
		caps.limits.vision = {
			supported_media_types: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
			max_prompt_images: 10,
			max_prompt_image_size: 10 * 1024 * 1024,
		};
	}
	return caps;
}

async function fetchOllamaShowCapabilities(
	rootUrl: string,
	modelName: string,
	headers: Record<string, string>
): Promise<{vision: boolean; tools: boolean}> {
	const cacheKey = `${rootUrl}::${modelName}`;
	const cached = ollamaShowCache.get(cacheKey);
	if (cached) return cached;

	const promise = (async () => {
		try {
			const resp = await requestUrl({
				url: `${rootUrl}/api/show`,
				method: 'POST',
				headers,
				body: JSON.stringify({model: modelName}),
			});
			if (resp.status >= 200 && resp.status < 300) {
				const json = resp.json as Record<string, unknown>;
				const capabilities = Array.isArray(json?.capabilities) ? json.capabilities : [];
				const vision = capabilities.includes('vision');
				const tools = capabilities.includes('tools');
				return {vision, tools};
			}
		} catch {
			// Ignore errors and fall back to false
		}
		return {vision: false, tools: false};
	})();

	ollamaShowCache.set(cacheKey, promise);
	return promise;
}

/**
 * Build the auth headers for a BYOK provider request, mirroring the SDK's
 * `ProviderConfig` precedence: `bearerToken` takes precedence over `apiKey`
 * when both are set. Header shape depends on the provider preset:
 * - `azure` -> `api-key: <token>`
 * - `anthropic` -> `x-api-key: <token>`
 * - everything else -> `Authorization: Bearer <token>`
 */
function buildAuthHeaders(preset: ByokProviderPreset, apiKey?: string, bearerToken?: string): Record<string, string> {
	const headers: Record<string, string> = {'Content-Type': 'application/json'};
	const token = bearerToken || apiKey;
	if (!token) return headers;

	if (preset === 'azure') {
		headers['api-key'] = token;
	} else if (preset === 'anthropic') {
		headers['x-api-key'] = token;
	} else {
		headers['Authorization'] = `Bearer ${token}`;
	}

	return headers;
}

/**
 * Fetch and parse the model list from a BYOK provider endpoint.
 *
 * - `ollama` -> strips trailing `/v1` from baseUrl, then `GET ${root}/api/tags`,
 *   parsing `{ models: [{ name, ... }] }`.
 * - everything else -> `GET ${baseUrl}/v1/models`, parsing `{ data: [{ id, name?, ... }] }`.
 *   If baseUrl already ends in `/v1` (e.g. Azure default), appends only `/models`.
 *
 * Returns a discriminated result so callers can distinguish "0 models" from
 * "request failed".
 */
export async function fetchProviderModels(params: FetchProviderModelsParams): Promise<FetchProviderModelsResult> {
	const {preset, apiKey, bearerToken} = params;
	const baseUrl = params.baseUrl.replace(/\/$/, '');
	const headers = buildAuthHeaders(preset, apiKey, bearerToken);

	const rootUrl = preset === 'ollama' ? baseUrl.replace(/\/v1$/, '') : baseUrl;
	const url = preset === 'ollama'
		? `${rootUrl}/api/tags`
		: (rootUrl.endsWith('/v1') ? `${rootUrl}/models` : `${rootUrl}/v1/models`);

	try {
		const resp = await requestUrl({url, headers});
		if (resp.status < 200 || resp.status >= 300) {
			return {ok: false, error: `HTTP ${resp.status}`};
		}
		const json = resp.json as Record<string, unknown>;

		if (preset === 'ollama') {
			const rawModels = Array.isArray(json.models) ? json.models : [];
			const modelsPromises: Promise<ModelInfo | null>[] = rawModels.map(async m => {
				const entry = toRecordOrNull(m);
				const name = typeof entry?.name === 'string' ? entry.name : '';
				if (name.length === 0) return null;

				const details = toRecordOrNull(entry?.details);
				const family = typeof details?.family === 'string' ? details.family.toLowerCase() : '';
				const families = Array.isArray(details?.families) ? details.families.map(f => String(f).toLowerCase()) : [];
				const nameMatches = /vision|llava|minicpm|moondream|gemma3/i.test(name);
				const heuristicVision = family === 'mllama' || family === 'clip' || families.includes('mllama') || families.includes('clip') || nameMatches;

				let supportsVision = heuristicVision;
				if (!supportsVision) {
					const showCaps = await fetchOllamaShowCapabilities(rootUrl, name, headers);
					if (showCaps.vision) supportsVision = true;
				}

				return {
					id: name,
					name,
					capabilities: createCapabilities(supportsVision, false),
				};
			});

			const resolvedModels = await Promise.all(modelsPromises);
			const models = resolvedModels.filter((m): m is ModelInfo => m !== null);
			return {ok: true, models};
		}

		const rawData = Array.isArray(json.data) ? json.data : [];
		const models: ModelInfo[] = rawData
			.map(m => {
				const entry = toRecordOrNull(m);
				const id = entry?.id;
				const name = entry?.name;
				if (typeof id !== 'string' || id.length === 0) return null;
				const displayName = (typeof name === 'string' && name.length > 0) ? name : id;
				const supportsVision = VISION_REGEX.test(id) || VISION_REGEX.test(displayName);
				const supportsReasoning = REASONING_REGEX.test(id) || REASONING_REGEX.test(displayName);

				const modelInfo: ModelInfo = {
					id,
					name: displayName,
					capabilities: createCapabilities(supportsVision, supportsReasoning),
				};
				if (supportsReasoning) {
					modelInfo.supportedReasoningEfforts = ['low', 'medium', 'high'] as ReasoningEffort[];
					modelInfo.defaultReasoningEffort = 'medium' as ReasoningEffort;
				}
				return modelInfo;
			})
			.filter((m): m is ModelInfo => m !== null);
		return {ok: true, models};
	} catch (e) {
		return {ok: false, error: String(e)};
	}
}
