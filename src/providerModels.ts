import {requestUrl} from 'obsidian';
import type {ModelInfo} from './copilot';

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

const placeholderCapabilities: ModelInfo['capabilities'] = {
	supports: {vision: false, reasoningEffort: false},
	limits: {max_context_window_tokens: 0},
};

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
 * - `ollama` -> `GET ${baseUrl}/api/tags`, parsing `{ models: [{ name, ... }] }`.
 * - everything else -> `GET ${baseUrl}/v1/models`, parsing `{ data: [{ id, name?, ... }] }`.
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
			// Ollama format: { models: [{ name, ... }] }
			const models = (json.models ?? []) as Array<{name: string; modified_at?: string}>;
			return {
				ok: true,
				models: models.map(m => ({
					id: m.name,
					name: m.name,
					capabilities: placeholderCapabilities,
				})) as ModelInfo[],
			};
		}

		// OpenAI-compatible format: { data: [{ id, name?, ... }] }
		const data = (json.data ?? []) as Array<{id: string; name?: string}>;
		return {
			ok: true,
			models: data.map(m => ({
				id: m.id,
				name: m.name ?? m.id,
				capabilities: placeholderCapabilities,
			})) as ModelInfo[],
		};
	} catch (e) {
		return {ok: false, error: String(e)};
	}
}
