import { inferenceHeaders, runInference } from './inference.js';
import { json, RequestError } from '../utils.js';

export async function handleTranscription(request, env, ctx, model) {
	let form;
	try {
		form = await request.formData();
	} catch {
		throw new RequestError('Expected multipart/form-data with an audio "file" field.', { status: 400, code: 'invalid_form_data' });
	}
	const file = form.get('file');
	if (!file || typeof file.arrayBuffer !== 'function') {
		throw new RequestError('file is required', { status: 400, code: 'missing_file', param: 'file' });
	}
	if (file.size > 25 * 1024 * 1024) {
		throw new RequestError('Audio file is larger than the 25 MB limit.', { status: 413, code: 'request_too_large' });
	}

	const language = form.get('language');
	const prompt = form.get('prompt');
	const responseFormat = form.get('response_format') || 'json';
	const temperature = form.get('temperature');

	const body = {};
	if (language) body.language = String(language);
	if (prompt) body.prompt = String(prompt);
	if (temperature) body.temperature = Number(temperature);
	if (responseFormat === 'verbose_json') body.vtt = true;

	const result = await runInference(request, env, ctx, {
		model,
		task: 'transcription',
		body,
		endpoint: 'native',
		rawBody: await file.arrayBuffer(),
		contentType: file.type || 'audio/mpeg',
	});

	const contentType = result.response.headers.get('Content-Type') || '';
	let data;
	if (contentType.includes('json')) {
		data = await result.response.json();
	} else {
		const text = await result.response.text();
		data = { text };
	}

	const output = data?.result ?? data;
	const text = output?.text ?? '';
	await result.settle(result.estimate, null);

	const headers = inferenceHeaders(result, { 'Content-Type': 'application/json; charset=utf-8' });
	if (responseFormat === 'text') {
		headers.set('Content-Type', 'text/plain; charset=utf-8');
		return new Response(text, { headers });
	}
	if (responseFormat === 'vtt') {
		headers.set('Content-Type', 'text/vtt; charset=utf-8');
		return new Response(output?.vtt || text, { headers });
	}
	if (responseFormat === 'srt') {
		headers.set('Content-Type', 'application/x-subrip; charset=utf-8');
		return new Response(output?.vtt ? vttToSrt(output.vtt) : text, { headers });
	}
	if (responseFormat === 'verbose_json') {
		return json({
			task: 'transcribe',
			language: language || null,
			duration: output?.duration ?? null,
			text,
			segments: output?.segments || null,
			words: output?.words || null,
		}, { headers });
	}
	return json({ text }, { headers });
}

function vttToSrt(vtt) {
	return String(vtt)
		.replace(/^WEBVTT[^\n]*\n+/i, '')
		.replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export async function handleSpeech(request, env, ctx, model) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw new RequestError('Invalid JSON body', { status: 400 });
	}
	if (!body.input) {
		throw new RequestError('input is required', { status: 400, code: 'missing_input', param: 'input' });
	}

	let input;
	if (model.id.includes('melotts')) {
		input = { prompt: String(body.input), lang: body.language || body.lang || 'en' };
	} else if (model.id.includes('aura')) {
		input = { text: String(body.input) };
		if (body.voice) input.voice = String(body.voice);
	} else {
		input = { prompt: String(body.input) };
	}

	const result = await runInference(request, env, ctx, {
		model,
		task: 'speech',
		body: input,
		endpoint: 'native',
	});

	const upstreamType = result.response.headers.get('Content-Type') || 'audio/mpeg';
	if (upstreamType.includes('json')) {
		const data = await result.response.json();
		const audio = data?.result?.audio || data?.audio || data?.result;
		await result.settle(result.estimate);
		if (typeof audio === 'string') {
			const bytes = Uint8Array.from(atob(audio), (char) => char.charCodeAt(0));
			return new Response(bytes, {
				headers: inferenceHeaders(result, { 'Content-Type': 'audio/mpeg' }),
			});
		}
		throw new RequestError('Cloudflare returned an unexpected TTS payload.', { status: 502, code: 'upstream_invalid_response' });
	}

	const transform = new TransformStream({
		async flush() {
			await result.settle(result.estimate);
		},
	});
	const headers = inferenceHeaders(result, { 'Content-Type': upstreamType });
	headers.set('Content-Disposition', 'inline; filename="speech.mp3"');
	return new Response(result.response.body.pipeThrough(transform), { headers });
}
