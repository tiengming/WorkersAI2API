export default {
	"generated_at": "2026-10-22T03:08:01.063Z",
	"free_daily_neurons": 10000,
	"pricing": {
		"models": {
			"@cf/meta/llama-3.2-1b-instruct": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.027,
						"neurons": 2457,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.201,
						"neurons": 18252,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.027,
					"input_neurons_per_million": 2457,
					"output_usd_per_million": 0.201,
					"output_neurons_per_million": 18252
				},
				"display": "$0.027 / input · $0.201 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3.2-3b-instruct": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.051,
						"neurons": 4625,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.335,
						"neurons": 30475,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.051,
					"input_neurons_per_million": 4625,
					"output_usd_per_million": 0.335,
					"output_neurons_per_million": 30475
				},
				"display": "$0.051 / input · $0.335 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3.1-8b-instruct-fp8-fast": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.045,
						"neurons": 4119,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.384,
						"neurons": 34868,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.045,
					"input_neurons_per_million": 4119,
					"output_usd_per_million": 0.384,
					"output_neurons_per_million": 34868
				},
				"display": "$0.045 / input · $0.384 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3.2-11b-vision-instruct": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.049,
						"neurons": 4410,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.676,
						"neurons": 61493,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.049,
					"input_neurons_per_million": 4410,
					"output_usd_per_million": 0.676,
					"output_neurons_per_million": 61493
				},
				"display": "$0.049 / input · $0.676 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3.1-70b-instruct-fp8-fast": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.293,
						"neurons": 26668,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 2.253,
						"neurons": 204805,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.293,
					"input_neurons_per_million": 26668,
					"output_usd_per_million": 2.253,
					"output_neurons_per_million": 204805
				},
				"display": "$0.293 / input · $2.253 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.293,
						"neurons": 26668,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 2.253,
						"neurons": 204805,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.293,
					"input_neurons_per_million": 26668,
					"output_usd_per_million": 2.253,
					"output_neurons_per_million": 204805
				},
				"display": "$0.293 / input · $2.253 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.497,
						"neurons": 45170,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4.881,
						"neurons": 443756,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.497,
					"input_neurons_per_million": 45170,
					"output_usd_per_million": 4.881,
					"output_neurons_per_million": 443756
				},
				"display": "$0.497 / input · $4.881 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepseek-ai/deepseek-v4-flash-0731": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.44,
						"neurons": 40000,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.014,
						"neurons": 1273,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1.32,
						"neurons": 120000,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.44,
					"input_neurons_per_million": 40000,
					"output_usd_per_million": 1.32,
					"output_neurons_per_million": 120000,
					"cached_input_usd_per_million": 0.014,
					"cached_input_neurons_per_million": 1273
				},
				"display": "$0.44 / input · $0.014 / cached input · $1.32 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepseek-ai/deepseek-v4.1-flash-1017": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.3,
						"neurons": 27273,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.006,
						"neurons": 545,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1.2,
						"neurons": 109091,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.3,
					"input_neurons_per_million": 27273,
					"output_usd_per_million": 1.2,
					"output_neurons_per_million": 109091,
					"cached_input_usd_per_million": 0.006,
					"cached_input_neurons_per_million": 545
				},
				"display": "$0.3 / input · $0.006 / cached input · $1.2 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepseek-ai/deepseek-v4-pro-0813": {
				"items": [
					{
						"kind": "input_token",
						"usd": 1.32,
						"neurons": 120000,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.044,
						"neurons": 4000,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 3.96,
						"neurons": 360000,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 1.32,
					"input_neurons_per_million": 120000,
					"output_usd_per_million": 3.96,
					"output_neurons_per_million": 360000,
					"cached_input_usd_per_million": 0.044,
					"cached_input_neurons_per_million": 4000
				},
				"display": "$1.32 / input · $0.044 / cached input · $3.96 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/mistral/mistral-7b-instruct-v0.1": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.11,
						"neurons": 10000,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.19,
						"neurons": 17300,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.11,
					"input_neurons_per_million": 10000,
					"output_usd_per_million": 0.19,
					"output_neurons_per_million": 17300
				},
				"display": "$0.11 / input · $0.19 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/mistralai/mistral-small-3.1-24b-instruct": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.351,
						"neurons": 31876,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.555,
						"neurons": 50488,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.351,
					"input_neurons_per_million": 31876,
					"output_usd_per_million": 0.555,
					"output_neurons_per_million": 50488
				},
				"display": "$0.351 / input · $0.555 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3.1-8b-instruct": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.282,
						"neurons": 25608,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.827,
						"neurons": 75147,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.282,
					"input_neurons_per_million": 25608,
					"output_usd_per_million": 0.827,
					"output_neurons_per_million": 75147
				},
				"display": "$0.282 / input · $0.827 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3.1-8b-instruct-fp8": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.152,
						"neurons": 13778,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.287,
						"neurons": 26128,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.152,
					"input_neurons_per_million": 13778,
					"output_usd_per_million": 0.287,
					"output_neurons_per_million": 26128
				},
				"display": "$0.152 / input · $0.287 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3.1-8b-instruct-awq": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.123,
						"neurons": 11161,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.266,
						"neurons": 24215,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.123,
					"input_neurons_per_million": 11161,
					"output_usd_per_million": 0.266,
					"output_neurons_per_million": 24215
				},
				"display": "$0.123 / input · $0.266 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3-8b-instruct": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.282,
						"neurons": 25608,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.827,
						"neurons": 75147,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.282,
					"input_neurons_per_million": 25608,
					"output_usd_per_million": 0.827,
					"output_neurons_per_million": 75147
				},
				"display": "$0.282 / input · $0.827 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-3-8b-instruct-awq": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.123,
						"neurons": 11161,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.266,
						"neurons": 24215,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.123,
					"input_neurons_per_million": 11161,
					"output_usd_per_million": 0.266,
					"output_neurons_per_million": 24215
				},
				"display": "$0.123 / input · $0.266 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-2-7b-chat-fp16": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.556,
						"neurons": 50505,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 6.667,
						"neurons": 606061,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.556,
					"input_neurons_per_million": 50505,
					"output_usd_per_million": 6.667,
					"output_neurons_per_million": 606061
				},
				"display": "$0.556 / input · $6.667 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-guard-3-8b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.484,
						"neurons": 44003,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.03,
						"neurons": 2730,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.484,
					"input_neurons_per_million": 44003,
					"output_usd_per_million": 0.03,
					"output_neurons_per_million": 2730
				},
				"display": "$0.484 / input · $0.03 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/llama-4-scout-17b-16e-instruct": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.27,
						"neurons": 24545,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.85,
						"neurons": 77273,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.27,
					"input_neurons_per_million": 24545,
					"output_usd_per_million": 0.85,
					"output_neurons_per_million": 77273
				},
				"display": "$0.27 / input · $0.85 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/google/gemma-3-12b-it": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.345,
						"neurons": 31371,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.556,
						"neurons": 50560,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.345,
					"input_neurons_per_million": 31371,
					"output_usd_per_million": 0.556,
					"output_neurons_per_million": 50560
				},
				"display": "$0.345 / input · $0.556 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/qwen/qwq-32b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.66,
						"neurons": 60000,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1,
						"neurons": 90909,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.66,
					"input_neurons_per_million": 60000,
					"output_usd_per_million": 1,
					"output_neurons_per_million": 90909
				},
				"display": "$0.66 / input · $1 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/qwen/qwen2.5-coder-32b-instruct": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.66,
						"neurons": 60000,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1,
						"neurons": 90909,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.66,
					"input_neurons_per_million": 60000,
					"output_usd_per_million": 1,
					"output_neurons_per_million": 90909
				},
				"display": "$0.66 / input · $1 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/qwen/qwen3-30b-a3b-fp8": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.051,
						"neurons": 4625,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.335,
						"neurons": 30475,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.051,
					"input_neurons_per_million": 4625,
					"output_usd_per_million": 0.335,
					"output_neurons_per_million": 30475
				},
				"display": "$0.051 / input · $0.335 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/qwen/qwen3.8-27b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.45,
						"neurons": 40909,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 3.2,
						"neurons": 290909,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.45,
					"input_neurons_per_million": 40909,
					"output_usd_per_million": 3.2,
					"output_neurons_per_million": 290909
				},
				"display": "$0.45 / input · $3.2 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/openai/gpt-oss-120b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.35,
						"neurons": 31818,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.75,
						"neurons": 68182,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.35,
					"input_neurons_per_million": 31818,
					"output_usd_per_million": 0.75,
					"output_neurons_per_million": 68182
				},
				"display": "$0.35 / input · $0.75 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/openai/gpt-oss-20b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.2,
						"neurons": 18182,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.3,
						"neurons": 27273,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.2,
					"input_neurons_per_million": 18182,
					"output_usd_per_million": 0.3,
					"output_neurons_per_million": 27273
				},
				"display": "$0.2 / input · $0.3 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/aisingapore/gemma-sea-lion-v4-27b-it": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.351,
						"neurons": 31876,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.555,
						"neurons": 50488,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.351,
					"input_neurons_per_million": 31876,
					"output_usd_per_million": 0.555,
					"output_neurons_per_million": 50488
				},
				"display": "$0.351 / input · $0.555 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/ibm-granite/granite-4.0-h-micro": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.017,
						"neurons": 1542,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.112,
						"neurons": 10158,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.017,
					"input_neurons_per_million": 1542,
					"output_usd_per_million": 0.112,
					"output_neurons_per_million": 10158
				},
				"display": "$0.017 / input · $0.112 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/zai-org/glm-4.7-flash": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.06,
						"neurons": 5500,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.4,
						"neurons": 36400,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.06,
					"input_neurons_per_million": 5500,
					"output_usd_per_million": 0.4,
					"output_neurons_per_million": 36400
				},
				"display": "$0.06 / input · $0.4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/zai-org/glm-5.2": {
				"items": [
					{
						"kind": "input_token",
						"usd": 1.4,
						"neurons": 127273,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.26,
						"neurons": 23636,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4.4,
						"neurons": 400000,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 1.4,
					"input_neurons_per_million": 127273,
					"output_usd_per_million": 4.4,
					"output_neurons_per_million": 400000,
					"cached_input_usd_per_million": 0.26,
					"cached_input_neurons_per_million": 23636
				},
				"display": "$1.4 / input · $0.26 / cached input · $4.4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/zai-org/glm-5.3": {
				"items": [
					{
						"kind": "input_token",
						"usd": 1.4,
						"neurons": 127273,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.26,
						"neurons": 23636,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4.4,
						"neurons": 400000,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 1.4,
					"input_neurons_per_million": 127273,
					"output_usd_per_million": 4.4,
					"output_neurons_per_million": 400000,
					"cached_input_usd_per_million": 0.26,
					"cached_input_neurons_per_million": 23636
				},
				"display": "$1.4 / input · $0.26 / cached input · $4.4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/zai-org/glm-5.3-flash": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.15,
						"neurons": 13636,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.03,
						"neurons": 2727,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.5,
						"neurons": 45455,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.15,
					"input_neurons_per_million": 13636,
					"output_usd_per_million": 0.5,
					"output_neurons_per_million": 45455,
					"cached_input_usd_per_million": 0.03,
					"cached_input_neurons_per_million": 2727
				},
				"display": "$0.15 / input · $0.03 / cached input · $0.5 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/nvidia/nemotron-3-120b-a12b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.5,
						"neurons": 45455,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1.5,
						"neurons": 136364,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.5,
					"input_neurons_per_million": 45455,
					"output_usd_per_million": 1.5,
					"output_neurons_per_million": 136364
				},
				"display": "$0.5 / input · $1.5 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/moonshotai/kimi-k2.5": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.6,
						"neurons": 54545,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.1,
						"neurons": 9091,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 3,
						"neurons": 272727,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.6,
					"input_neurons_per_million": 54545,
					"output_usd_per_million": 3,
					"output_neurons_per_million": 272727,
					"cached_input_usd_per_million": 0.1,
					"cached_input_neurons_per_million": 9091
				},
				"display": "$0.6 / input · $0.1 / cached input · $3 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/moonshotai/kimi-k2.6": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.95,
						"neurons": 86364,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.16,
						"neurons": 14545,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4,
						"neurons": 363636,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.95,
					"input_neurons_per_million": 86364,
					"output_usd_per_million": 4,
					"output_neurons_per_million": 363636,
					"cached_input_usd_per_million": 0.16,
					"cached_input_neurons_per_million": 14545
				},
				"display": "$0.95 / input · $0.16 / cached input · $4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/moonshotai/kimi-k2.7-code": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.95,
						"neurons": 86364,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.19,
						"neurons": 17273,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4,
						"neurons": 363636,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.95,
					"input_neurons_per_million": 86364,
					"output_usd_per_million": 4,
					"output_neurons_per_million": 363636,
					"cached_input_usd_per_million": 0.19,
					"cached_input_neurons_per_million": 17273
				},
				"display": "$0.95 / input · $0.19 / cached input · $4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/google/gemma-4-26b-a4b-it": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.1,
						"neurons": 9091,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.3,
						"neurons": 27273,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.1,
					"input_neurons_per_million": 9091,
					"output_usd_per_million": 0.3,
					"output_neurons_per_million": 27273
				},
				"display": "$0.1 / input · $0.3 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/daily-co/phonellm-mini-alpha-2": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.06,
						"neurons": 5455,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.24,
						"neurons": 21818,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.06,
					"input_neurons_per_million": 5455,
					"output_usd_per_million": 0.24,
					"output_neurons_per_million": 21818
				},
				"display": "$0.06 / input · $0.24 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/baai/bge-small-en-v1.5": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.02,
						"neurons": 1841,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.02,
					"input_neurons_per_million": 1841
				},
				"display": "$0.02 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/baai/bge-base-en-v1.5": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.067,
						"neurons": 6058,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.067,
					"input_neurons_per_million": 6058
				},
				"display": "$0.067 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/baai/bge-large-en-v1.5": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.204,
						"neurons": 18582,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.204,
					"input_neurons_per_million": 18582
				},
				"display": "$0.204 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/baai/bge-m3": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.012,
						"neurons": 1075,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.012,
					"input_neurons_per_million": 1075
				},
				"display": "$0.012 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/pfnet/plamo-embedding-1b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.019,
						"neurons": 1689,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.019,
					"input_neurons_per_million": 1689
				},
				"display": "$0.019 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/qwen/qwen3-embedding-0.6b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.012,
						"neurons": 1075,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.012,
					"input_neurons_per_million": 1075
				},
				"display": "$0.012 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/black-forest-labs/flux-1-schnell": {
				"items": [
					{
						"kind": "image_tile",
						"usd": 0.0000528,
						"neurons": 4.8,
						"unit": "per 512x512 tile"
					},
					{
						"kind": "step",
						"usd": 0.0001056,
						"neurons": 9.6,
						"unit": "per step"
					}
				],
				"tokens": {},
				"display": "$0.0000528 / tile · $0.0001056 / step",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/leonardo/lucid-origin": {
				"items": [
					{
						"kind": "image_tile",
						"usd": 0.006996,
						"neurons": 636,
						"unit": "per 512x512 tile"
					},
					{
						"kind": "step",
						"usd": 0.000132,
						"neurons": 12,
						"unit": "per step"
					}
				],
				"tokens": {},
				"display": "$0.006996 / tile · $0.000132 / step",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/leonardo/phoenix-1.0": {
				"items": [
					{
						"kind": "image_tile",
						"usd": 0.00583,
						"neurons": 530,
						"unit": "per 512x512 tile"
					},
					{
						"kind": "step",
						"usd": 0.00011,
						"neurons": 10,
						"unit": "per step"
					}
				],
				"tokens": {},
				"display": "$0.00583 / tile · $0.00011 / step",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/black-forest-labs/flux-2-dev": {
				"items": [
					{
						"kind": "input_image_tile_step",
						"usd": 0.00021,
						"neurons": 18.75,
						"unit": "per input 512x512 tile, per step"
					},
					{
						"kind": "output_image_tile_step",
						"usd": 0.00041,
						"neurons": 37.5,
						"unit": "per output 512x512 tile, per step"
					}
				],
				"tokens": {},
				"display": "$0.00021 / input tile/step · $0.00041 / output tile/step",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/black-forest-labs/flux-2-klein-4b": {
				"items": [
					{
						"kind": "image_tile",
						"usd": 0.000059,
						"neurons": 5.37,
						"unit": "per input 512x512 tile"
					},
					{
						"kind": "image_tile",
						"usd": 0.000287,
						"neurons": 26.05,
						"unit": "per output 512x512 tile"
					}
				],
				"tokens": {},
				"display": "$0.000059 / tile · $0.000287 / tile",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/black-forest-labs/flux-2-klein-9b": {
				"items": [
					{
						"kind": "image_megapixel",
						"usd": 0.015,
						"neurons": 1363.64,
						"unit": "per first MP (1024x1024)"
					},
					{
						"kind": "image_megapixel",
						"usd": 0.002,
						"neurons": 181.82,
						"unit": "per subsequent MP"
					},
					{
						"kind": "image",
						"usd": 0.002,
						"neurons": 181.82,
						"unit": "per input image MP"
					}
				],
				"tokens": {},
				"display": "$0.015 / MP · $0.002 / MP · $0.002 / image",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/openai/whisper": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0005,
						"neurons": 41.14,
						"unit": "per audio minute"
					}
				],
				"tokens": {},
				"display": "$0.0005 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/openai/whisper-large-v3-turbo": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0005,
						"neurons": 46.63,
						"unit": "per audio minute"
					}
				],
				"tokens": {},
				"display": "$0.0005 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/myshell-ai/melotts": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0002,
						"neurons": 18.63,
						"unit": "per audio minute"
					}
				],
				"tokens": {},
				"display": "$0.0002 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepgram/aura-1": {
				"items": [
					{
						"kind": "character",
						"usd": 0.015,
						"neurons": 1,
						"unit": "per 1k characters input"
					}
				],
				"tokens": {},
				"display": "$0.015 / 1k chars",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepgram/nova-3": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0052,
						"neurons": 472.73,
						"unit": "per audio minute input"
					}
				],
				"tokens": {},
				"display": "$0.0052 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepgram/nova-3#websocket": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0092,
						"neurons": 836.36,
						"unit": "per audio minute input"
					}
				],
				"display": "$0.0092 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/pipecat-ai/smart-turn-v2": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.00033795,
						"neurons": 0.51,
						"unit": "per audio minute input"
					}
				],
				"tokens": {},
				"display": "$0.00033795 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepgram/aura-2-en": {
				"items": [
					{
						"kind": "character",
						"usd": 0.03,
						"neurons": 2727.27,
						"unit": "per 1k characters input"
					}
				],
				"tokens": {},
				"display": "$0.03 / 1k chars",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepgram/aura-2-es": {
				"items": [
					{
						"kind": "character",
						"usd": 0.03,
						"neurons": 2727.27,
						"unit": "per 1k characters input"
					}
				],
				"tokens": {},
				"display": "$0.03 / 1k chars",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/deepgram/flux": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0077,
						"neurons": 700,
						"unit": "per audio minute"
					}
				],
				"tokens": {},
				"display": "$0.0077 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/huggingface/distilbert-sst-2-int8": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.026,
						"neurons": 2394,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.026,
					"input_neurons_per_million": 2394
				},
				"display": "$0.026 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/baai/bge-reranker-base": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.003,
						"neurons": 283,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.003,
					"input_neurons_per_million": 283
				},
				"display": "$0.003 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/meta/m2m100-1.2b": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.342,
						"neurons": 31050,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.342,
						"neurons": 31050,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.342,
					"input_neurons_per_million": 31050,
					"output_usd_per_million": 0.342,
					"output_neurons_per_million": 31050
				},
				"display": "$0.342 / input · $0.342 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/microsoft/resnet-50": {
				"items": [
					{
						"kind": "image",
						"usd": 2.51,
						"neurons": 228055,
						"unit": "per M images"
					}
				],
				"tokens": {},
				"display": "$2.51 / image",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/ai4bharat/indictrans2-en-indic-1B": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.342,
						"neurons": 31050,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.342,
						"neurons": 31050,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.342,
					"input_neurons_per_million": 31050,
					"output_usd_per_million": 0.342,
					"output_neurons_per_million": 31050
				},
				"display": "$0.342 / input · $0.342 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/moondream/moondream3.1-9B-A2B": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.3,
						"neurons": 27273,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1,
						"neurons": 90909,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.3,
					"input_neurons_per_million": 27273,
					"output_usd_per_million": 1,
					"output_neurons_per_million": 90909
				},
				"display": "$0.3 / input · $1 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/cloudflare/clef": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.24,
						"neurons": 21818,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.24,
					"input_neurons_per_million": 21818
				},
				"display": "$0.24 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/cloudflare/clef-omni": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.15,
						"neurons": 13636,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.15,
					"input_neurons_per_million": 13636
				},
				"display": "$0.15 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/cloudflare/clef-flash": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.038,
						"neurons": 3455,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.038,
					"input_neurons_per_million": 3455
				},
				"display": "$0.038 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"@cf/cloudflare/clairic": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.1,
						"neurons": 9091,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.1,
					"input_neurons_per_million": 9091
				},
				"display": "$0.1 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			}
		},
		"paidOnly": [
			"@cf/moonshotai/kimi-k2.6",
			"@cf/moonshotai/kimi-k2.7-code",
			"@cf/zai-org/glm-5.2",
			"@cf/zai-org/glm-5.3",
			"@cf/zai-org/glm-5.3-flash",
			"@cf/deepseek-ai/deepseek-v4-flash-0731",
			"@cf/deepseek-ai/deepseek-v4.1-flash-1017",
			"@cf/deepseek-ai/deepseek-v4-pro-0813"
		],
		"freeDailyNeurons": 10000,
		"updatedAt": "Oct 20, 2026",
		"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
	},
	"models": [
		{
			"id": "@cf/zai-org/glm-5.3",
			"name": "glm-5.3",
			"author": "Zhipu AI",
			"task": "text-generation",
			"description": "GLM-5.3 is Z.ai's flagship agentic coding model, pairing a 1M-token context window with reasoning, function calling, and structured outputs to power multi-step, tool-driven development workflows.",
			"context_window": 1048576,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": true,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 1.4,
						"neurons": 127273,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.26,
						"neurons": 23636,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4.4,
						"neurons": 400000,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 1.4,
					"input_neurons_per_million": 127273,
					"output_usd_per_million": 4.4,
					"output_neurons_per_million": 400000,
					"cached_input_usd_per_million": 0.26,
					"cached_input_neurons_per_million": 23636
				},
				"display": "$1.4 / input · $0.26 / cached input · $4.4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": true,
			"deprecated": false,
			"free": false,
			"free_daily_output_tokens": 25000,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/glm-5.3/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/zai-org/glm-5.3",
				"glm-5.3"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 62.6,
				"tier": "B",
				"basis": [
					"size unknown",
					"1049k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 76,
					"context": 100,
					"recency": 45,
					"price": 78,
					"override": null
				},
				"rank": 1
			}
		},
		{
			"id": "@cf/deepseek-ai/deepseek-v4-pro-0813",
			"name": "deepseek-v4-pro-0813",
			"author": "DeepSeek",
			"task": "text-generation",
			"description": "DeepSeek V4 Pro is a high-capability reasoning model from DeepSeek with a one million token context window, built for long-horizon agentic workflows and complex, multi-step problem-solving",
			"context_window": 1048576,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 1.32,
						"neurons": 120000,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.044,
						"neurons": 4000,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 3.96,
						"neurons": 360000,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 1.32,
					"input_neurons_per_million": 120000,
					"output_usd_per_million": 3.96,
					"output_neurons_per_million": 360000,
					"cached_input_usd_per_million": 0.044,
					"cached_input_neurons_per_million": 4000
				},
				"display": "$1.32 / input · $0.044 / cached input · $3.96 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": true,
			"deprecated": false,
			"free": false,
			"free_daily_output_tokens": 27777,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/deepseek-v4-pro-0813/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepseek-ai/deepseek-v4-pro-0813",
				"deepseek-v4-pro-0813"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 60.4,
				"tier": "B",
				"basis": [
					"size unknown",
					"1049k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 68,
					"context": 100,
					"recency": 45,
					"price": 77,
					"override": null
				},
				"rank": 2
			}
		},
		{
			"id": "@cf/moonshotai/kimi-k2.7-code",
			"name": "kimi-k2.7-code",
			"author": "Moonshot AI",
			"task": "text-generation",
			"description": "Kimi K2.7 is a frontier-scale open-source 1T parameter model with a 262.1k context window, multi-turn tool calling, vision inputs, and structured outputs for agentic workloads.",
			"context_window": 262144,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": true,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.95,
						"neurons": 86364,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.19,
						"neurons": 17273,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4,
						"neurons": 363636,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.95,
					"input_neurons_per_million": 86364,
					"output_usd_per_million": 4,
					"output_neurons_per_million": 363636,
					"cached_input_usd_per_million": 0.19,
					"cached_input_neurons_per_million": 17273
				},
				"display": "$0.95 / input · $0.19 / cached input · $4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": true,
			"deprecated": false,
			"free": false,
			"free_daily_output_tokens": 27500,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/kimi-k2.7-code/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/moonshotai/kimi-k2.7-code",
				"kimi-k2.7-code"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 53.8,
				"tier": "B",
				"basis": [
					"size unknown",
					"262k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 56,
					"context": 76,
					"recency": 45,
					"price": 77,
					"override": null
				},
				"rank": 3
			}
		},
		{
			"id": "@cf/moonshotai/kimi-k2.6",
			"name": "kimi-k2.6",
			"author": "Moonshot AI",
			"task": "text-generation",
			"description": "Kimi K2.6 is a frontier-scale open-source 1T parameter model with a 262.1k context window, multi-turn tool calling, vision inputs, and structured outputs for agentic workloads.",
			"context_window": 262144,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": true,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.95,
						"neurons": 86364,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.16,
						"neurons": 14545,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4,
						"neurons": 363636,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.95,
					"input_neurons_per_million": 86364,
					"output_usd_per_million": 4,
					"output_neurons_per_million": 363636,
					"cached_input_usd_per_million": 0.16,
					"cached_input_neurons_per_million": 14545
				},
				"display": "$0.95 / input · $0.16 / cached input · $4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": true,
			"deprecated": false,
			"free": false,
			"free_daily_output_tokens": 27500,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/kimi-k2.6/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/moonshotai/kimi-k2.6",
				"kimi-k2.6"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 53.8,
				"tier": "B",
				"basis": [
					"size unknown",
					"262k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 56,
					"context": 76,
					"recency": 45,
					"price": 77,
					"override": null
				},
				"rank": 4
			}
		},
		{
			"id": "@cf/deepseek-ai/deepseek-v4-flash-0731",
			"name": "deepseek-v4-flash-0731",
			"author": "DeepSeek",
			"task": "text-generation",
			"description": "\"DeepSeek-V4-Flash-0731 is the official release of DeepSeek-V4-Flash, superseding the preview version, with substantially enhanced agentic capabilities. \"",
			"context_window": 1048576,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.44,
						"neurons": 40000,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.014,
						"neurons": 1273,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1.32,
						"neurons": 120000,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.44,
					"input_neurons_per_million": 40000,
					"output_usd_per_million": 1.32,
					"output_neurons_per_million": 120000,
					"cached_input_usd_per_million": 0.014,
					"cached_input_neurons_per_million": 1273
				},
				"display": "$0.44 / input · $0.014 / cached input · $1.32 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": true,
			"deprecated": false,
			"free": false,
			"free_daily_output_tokens": 83333,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/deepseek-v4-flash-0731/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepseek-ai/deepseek-v4-flash-0731",
				"deepseek-v4-flash-0731"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 53.5,
				"tier": "B",
				"basis": [
					"size unknown",
					"1049k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 48,
					"context": 100,
					"recency": 45,
					"price": 57,
					"override": null
				},
				"rank": 5
			}
		},
		{
			"id": "@cf/zai-org/glm-5.2",
			"name": "glm-5.2",
			"author": "Zhipu AI",
			"task": "text-generation",
			"description": "Z.ai's flagship agentic coding model",
			"context_window": 262144,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 1.4,
						"neurons": 127273,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.26,
						"neurons": 23636,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4.4,
						"neurons": 400000,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 1.4,
					"input_neurons_per_million": 127273,
					"output_usd_per_million": 4.4,
					"output_neurons_per_million": 400000,
					"cached_input_usd_per_million": 0.26,
					"cached_input_neurons_per_million": 23636
				},
				"display": "$1.4 / input · $0.26 / cached input · $4.4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": true,
			"deprecated": false,
			"free": false,
			"free_daily_output_tokens": 25000,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/glm-5.2/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/zai-org/glm-5.2",
				"glm-5.2"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 52,
				"tier": "B",
				"basis": [
					"size unknown",
					"262k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 48,
					"context": 76,
					"recency": 45,
					"price": 78,
					"override": null
				},
				"rank": 6
			}
		},
		{
			"id": "@cf/zai-org/glm-4.7-flash",
			"name": "glm-4.7-flash",
			"author": "Zhipu AI",
			"task": "text-generation",
			"description": "GLM-4.7-Flash is a fast and efficient multilingual text generation model with a 131,072 token context window. Optimized for dialogue, instruction-following, and multi-turn tool calling across 100+ languages.",
			"context_window": 131072,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": true
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.06,
						"neurons": 5500,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.4,
						"neurons": 36400,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.06,
					"input_neurons_per_million": 5500,
					"output_usd_per_million": 0.4,
					"output_neurons_per_million": 36400
				},
				"display": "$0.06 / input · $0.4 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 274725,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/zai-org/glm-4.7-flash",
				"glm-4.7-flash"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 50.9,
				"tier": "B",
				"basis": [
					"size unknown",
					"131k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 68,
					"context": 63,
					"recency": 45,
					"price": 36,
					"override": null
				},
				"rank": 7
			}
		},
		{
			"id": "@cf/ibm-granite/granite-4.0-h-micro",
			"name": "granite-4.0-h-micro",
			"author": "IBM",
			"task": "text-generation",
			"description": "Granite 4.0 instruct models deliver strong performance across benchmarks, achieving industry-leading results in key agentic tasks like instruction following and function calling. These efficiencies make the models well-suited for a wide range of use cases like retrieval-augmented generation (RAG), multi-agent workflows, and edge deployments.",
			"context_window": 131000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.017,
						"neurons": 1542,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.112,
						"neurons": 10158,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.017,
					"input_neurons_per_million": 1542,
					"output_usd_per_million": 0.112,
					"output_neurons_per_million": 10158
				},
				"display": "$0.017 / input · $0.112 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 984445,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/granite-4.0-h-micro/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/ibm-granite/granite-4.0-h-micro",
				"granite-4.0-h-micro"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 43.6,
				"tier": "C",
				"basis": [
					"size unknown",
					"131k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 48,
					"context": 63,
					"recency": 45,
					"price": 14,
					"override": null
				},
				"rank": 8
			}
		},
		{
			"id": "@cf/baai/bge-base-en-v1.5",
			"name": "bge-base-en-v1.5",
			"author": "BAAI",
			"task": "text-embeddings",
			"description": "BAAI general embedding (Base) model that transforms any given text into a 768-dimensional vector",
			"context_window": 153600,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.067,
						"neurons": 6058,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.067,
					"input_neurons_per_million": 6058
				},
				"display": "$0.067 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 1650709,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/embeddings",
				"/v1/run"
			],
			"aliases": [
				"@cf/baai/bge-base-en-v1.5",
				"bge-base-en-v1.5"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 42.7,
				"tier": "C",
				"basis": [
					"size unknown",
					"154k context",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 66,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 9
			}
		},
		{
			"id": "@cf/nvidia/nemotron-3-120b-a12b",
			"name": "nemotron-3-120b-a12b",
			"author": "NVIDIA",
			"task": "text-generation",
			"description": "NVIDIA Nemotron 3 Super is a hybrid MoE model with leading accuracy for multi-agent applications and specialized agentic AI systems.",
			"context_window": 256000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.5,
						"neurons": 45455,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1.5,
						"neurons": 136364,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.5,
					"input_neurons_per_million": 45455,
					"output_usd_per_million": 1.5,
					"output_neurons_per_million": 136364
				},
				"display": "$0.5 / input · $1.5 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 73333,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/nemotron-3-120b-a12b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/nvidia/nemotron-3-120b-a12b",
				"nemotron-3-120b-a12b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 41,
				"tier": "C",
				"basis": [
					"12B active",
					"256k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 68,
					"context": 75,
					"recency": 45,
					"price": 60,
					"override": null
				},
				"rank": 10
			}
		},
		{
			"id": "@cf/cloudflare/clairic",
			"name": "clairic",
			"author": "Cloudflare",
			"task": "text-generation",
			"description": "Clairic is a System One-style model that can extract, compute, estimate, and forecast values from inputs. It is strongly typed and outputs confidence scores and probabilities against its outputs. This model is in preview from the Cloudflare Workers AI team.",
			"context_window": 65536,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.1,
						"neurons": 9091,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.1,
					"input_neurons_per_million": 9091
				},
				"display": "$0.1 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 1099989,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/clairic/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/cloudflare/clairic",
				"clairic"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 40.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"66k context",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 51,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 11
			}
		},
		{
			"id": "@cf/baai/bge-m3",
			"name": "bge-m3",
			"author": "BAAI",
			"task": "text-embeddings",
			"description": "Multi-Functionality, Multi-Linguality, and Multi-Granularity embeddings model.",
			"context_window": 60000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.012,
						"neurons": 1075,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.012,
					"input_neurons_per_million": 1075
				},
				"display": "$0.012 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 9302325,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-m3/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/embeddings",
				"/v1/run"
			],
			"aliases": [
				"@cf/baai/bge-m3",
				"bge-m3"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 40.1,
				"tier": "C",
				"basis": [
					"size unknown",
					"60k context",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 49,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 12
			}
		},
		{
			"id": "@cf/deepseek-ai/deepseek-v4.1-flash-1017",
			"name": "deepseek-v4.1-flash-1017",
			"author": "DeepSeek",
			"task": "text-generation",
			"description": "We introduce DeepSeek-V4.1-Flash, a multimodal Mixture-of-Experts (MoE) model with 552B backbone parameters and support for contexts of up to one million tokens. The model natively processes images and text, and generates text autoregressively.",
			"context_window": 1048576,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.3,
						"neurons": 27273,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.006,
						"neurons": 545,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1.2,
						"neurons": 109091,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.3,
					"input_neurons_per_million": 27273,
					"output_usd_per_million": 1.2,
					"output_neurons_per_million": 109091,
					"cached_input_usd_per_million": 0.006,
					"cached_input_neurons_per_million": 545
				},
				"display": "$0.3 / input · $0.006 / cached input · $1.2 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": true,
			"deprecated": false,
			"free": false,
			"free_daily_output_tokens": 91666,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/deepseek-v4.1-flash-1017/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepseek-ai/deepseek-v4.1-flash-1017",
				"deepseek-v4.1-flash-1017"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 39.3,
				"tier": "C",
				"basis": [
					"552B parameters",
					"1049k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 48,
					"context": 100,
					"recency": 45,
					"price": 56,
					"override": null
				},
				"rank": 13
			}
		},
		{
			"id": "@cf/deepgram/aura-2-es",
			"name": "aura-2-es",
			"author": "Deepgram",
			"task": "text-to-speech",
			"description": "Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"audio"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": true,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "character",
						"usd": 0.03,
						"neurons": 2727.27,
						"unit": "per 1k characters input"
					}
				],
				"tokens": {},
				"display": "$0.03 / 1k chars",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/aura-2-es/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/speech",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepgram/aura-2-es",
				"aura-2-es"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 14
			}
		},
		{
			"id": "@cf/deepgram/aura-2-en",
			"name": "aura-2-en",
			"author": "Deepgram",
			"task": "text-to-speech",
			"description": "Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"audio"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": true,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "character",
						"usd": 0.03,
						"neurons": 2727.27,
						"unit": "per 1k characters input"
					}
				],
				"tokens": {},
				"display": "$0.03 / 1k chars",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/aura-2-en/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/speech",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepgram/aura-2-en",
				"aura-2-en"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 15
			}
		},
		{
			"id": "@cf/deepgram/flux",
			"name": "flux",
			"author": "Deepgram",
			"task": "automatic-speech-recognition",
			"description": "Flux is the first conversational speech recognition model built specifically for voice agents.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"audio"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": true,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0077,
						"neurons": 700,
						"unit": "per audio minute"
					}
				],
				"tokens": {},
				"display": "$0.0077 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/flux/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/transcriptions",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepgram/flux",
				"flux"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 16
			}
		},
		{
			"id": "@cf/deepgram/aura-1",
			"name": "aura-1",
			"author": "Deepgram",
			"task": "text-to-speech",
			"description": "Aura is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"audio"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": true,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "character",
						"usd": 0.015,
						"neurons": 1,
						"unit": "per 1k characters input"
					}
				],
				"tokens": {},
				"display": "$0.015 / 1k chars",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/aura-1/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/speech",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepgram/aura-1",
				"aura-1"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 17
			}
		},
		{
			"id": "@cf/myshell-ai/melotts",
			"name": "melotts",
			"author": "MyShell",
			"task": "text-to-speech",
			"description": "MeloTTS is a high-quality multi-lingual text-to-speech library by MyShell.ai.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"audio"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": true,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0002,
						"neurons": 18.63,
						"unit": "per audio minute"
					}
				],
				"tokens": {},
				"display": "$0.0002 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/melotts/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/speech",
				"/v1/run"
			],
			"aliases": [
				"@cf/myshell-ai/melotts",
				"melotts"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 18
			}
		},
		{
			"id": "@cf/deepgram/nova-3",
			"name": "nova-3",
			"author": "Deepgram",
			"task": "automatic-speech-recognition",
			"description": "Transcribe audio using Deepgram’s speech-to-text model",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"audio"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": true,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0052,
						"neurons": 472.73,
						"unit": "per audio minute input"
					}
				],
				"tokens": {},
				"display": "$0.0052 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/nova-3/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/transcriptions",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepgram/nova-3",
				"nova-3"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 19
			}
		},
		{
			"id": "@cf/openai/whisper",
			"name": "whisper",
			"author": "OpenAI",
			"task": "automatic-speech-recognition",
			"description": "Whisper is a general-purpose speech recognition model. It is trained on a large dataset of diverse audio and is also a multitasking model that can perform multilingual speech recognition, speech translation, and language identification.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"audio"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": true,
				"audio_output": false,
				"streaming": true,
				"multilingual": true
			},
			"pricing": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0005,
						"neurons": 41.14,
						"unit": "per audio minute"
					}
				],
				"tokens": {},
				"display": "$0.0005 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/whisper/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/transcriptions",
				"/v1/run"
			],
			"aliases": [
				"@cf/openai/whisper",
				"whisper"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 20
			}
		},
		{
			"id": "@cf/openai/whisper-tiny-en",
			"name": "whisper-tiny-en",
			"author": "OpenAI",
			"task": "automatic-speech-recognition",
			"description": "Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. Trained on 680k hours of labelled data, Whisper models demonstrate a strong ability to generalize to many datasets and domains without the need for fine-tuning. This is the English-only version of the Whisper Tiny model which was trained on the task of speech recognition.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"audio"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": true,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/whisper-tiny-en/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/transcriptions",
				"/v1/run"
			],
			"aliases": [
				"@cf/openai/whisper-tiny-en",
				"whisper-tiny-en"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 21
			}
		},
		{
			"id": "@cf/openai/whisper-large-v3-turbo",
			"name": "whisper-large-v3-turbo",
			"author": "OpenAI",
			"task": "automatic-speech-recognition",
			"description": "\"Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. \"",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"audio"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": true,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.0005,
						"neurons": 46.63,
						"unit": "per audio minute"
					}
				],
				"tokens": {},
				"display": "$0.0005 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/audio/transcriptions",
				"/v1/run"
			],
			"aliases": [
				"@cf/openai/whisper-large-v3-turbo",
				"whisper-large-v3-turbo"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.8,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 36,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 22
			}
		},
		{
			"id": "@cf/google/gemma-4-26b-a4b-it",
			"name": "gemma-4-26b-a4b-it",
			"author": "Google",
			"task": "text-generation",
			"description": "Gemma 4 is Google's most intelligent family of open models, built from Gemini 3 research to maximize intelligence-per-parameter.",
			"context_window": 256000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.1,
						"neurons": 9091,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.3,
						"neurons": 27273,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.1,
					"input_neurons_per_million": 9091,
					"output_usd_per_million": 0.3,
					"output_neurons_per_million": 27273
				},
				"display": "$0.1 / input · $0.3 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 366663,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/google/gemma-4-26b-a4b-it",
				"gemma-4-26b-a4b-it"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 38.2,
				"tier": "C",
				"basis": [
					"4B active",
					"256k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 68,
					"context": 75,
					"recency": 45,
					"price": 31,
					"override": null
				},
				"rank": 23
			}
		},
		{
			"id": "@cf/daily-co/phonellm-mini-alpha-2",
			"name": "phonellm-mini-alpha-2",
			"author": "daily-co",
			"task": "text-generation",
			"description": "PhoneLLM is an open model tuned for voice agents. The model is based on Nemotron Nano 30B base capabilities and excels at typical voice agent tasks with thinking disabled.",
			"context_window": 262140,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.06,
						"neurons": 5455,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.24,
						"neurons": 21818,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.06,
					"input_neurons_per_million": 5455,
					"output_usd_per_million": 0.24,
					"output_neurons_per_million": 21818
				},
				"display": "$0.06 / input · $0.24 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 458337,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/phonellm-mini-alpha-2/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/daily-co/phonellm-mini-alpha-2",
				"phonellm-mini-alpha-2"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.9,
				"tier": "C",
				"basis": [
					"30B parameters",
					"262k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 68,
					"context": 76,
					"recency": 45,
					"price": 28,
					"override": null
				},
				"rank": 24
			}
		},
		{
			"id": "@cf/openai/gpt-oss-120b",
			"name": "gpt-oss-120b",
			"author": "OpenAI",
			"task": "text-generation",
			"description": "OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-120b is for production, general purpose, high reasoning use-cases.",
			"context_window": 128000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.35,
						"neurons": 31818,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.75,
						"neurons": 68182,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.35,
					"input_neurons_per_million": 31818,
					"output_usd_per_million": 0.75,
					"output_neurons_per_million": 68182
				},
				"display": "$0.35 / input · $0.75 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 146666,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/openai/gpt-oss-120b",
				"gpt-oss-120b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.9,
				"tier": "C",
				"basis": [
					"120B parameters",
					"128k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 68,
					"context": 63,
					"recency": 45,
					"price": 47,
					"override": null
				},
				"rank": 25
			}
		},
		{
			"id": "@cf/zai-org/glm-5.3-flash",
			"name": "glm-5.3-flash",
			"author": "Zhipu AI",
			"task": "text-generation",
			"description": "The first natively multimodal model in the GLM-5 series. With 320B total parameters and just 18B active parameters, it outperforms GLM-5.2 across benchmarks and real-world workloads at one-tenth the price, while approaching Claude Opus 4.8 on coding and agentic benchmarks.",
			"context_window": 1048576,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.15,
						"neurons": 13636,
						"unit": "per M input tokens"
					},
					{
						"kind": "cached_input_token",
						"usd": 0.03,
						"neurons": 2727,
						"unit": "per M cached input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.5,
						"neurons": 45455,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.15,
					"input_neurons_per_million": 13636,
					"output_usd_per_million": 0.5,
					"output_neurons_per_million": 45455,
					"cached_input_usd_per_million": 0.03,
					"cached_input_neurons_per_million": 2727
				},
				"display": "$0.15 / input · $0.03 / cached input · $0.5 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": true,
			"deprecated": false,
			"free": false,
			"free_daily_output_tokens": 219997,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/glm-5.3-flash/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/zai-org/glm-5.3-flash",
				"glm-5.3-flash"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.8,
				"tier": "C",
				"basis": [
					"320B parameters",
					"1049k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 48,
					"context": 100,
					"recency": 45,
					"price": 40,
					"override": null
				},
				"rank": 26
			}
		},
		{
			"id": "@cf/qwen/qwen3.8-27b",
			"name": "qwen3.8-27b",
			"author": "Qwen",
			"task": "text-generation",
			"description": "Qwen 3.8 27B is a 27-billion-parameter instruction-tuned language model from Alibaba's Qwen family, designed for vision, efficient general-purpose text generation and agentic workloads.",
			"context_window": 262144,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.45,
						"neurons": 40909,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 3.2,
						"neurons": 290909,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.45,
					"input_neurons_per_million": 40909,
					"output_usd_per_million": 3.2,
					"output_neurons_per_million": 290909
				},
				"display": "$0.45 / input · $3.2 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 34375,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/qwen/qwen3.8-27b",
				"qwen3.8-27b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.4,
				"tier": "C",
				"basis": [
					"27B parameters",
					"262k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 48,
					"context": 76,
					"recency": 45,
					"price": 73,
					"override": null
				},
				"rank": 27
			}
		},
		{
			"id": "@cf/baai/bge-large-en-v1.5",
			"name": "bge-large-en-v1.5",
			"author": "BAAI",
			"task": "text-embeddings",
			"description": "BAAI general embedding (Large) model that transforms any given text into a 1024-dimensional vector",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.204,
						"neurons": 18582,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.204,
					"input_neurons_per_million": 18582
				},
				"display": "$0.204 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 538155,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-large-en-v1.5/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/embeddings",
				"/v1/run"
			],
			"aliases": [
				"@cf/baai/bge-large-en-v1.5",
				"bge-large-en-v1.5"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 28
			}
		},
		{
			"id": "@cf/baai/bge-reranker-base",
			"name": "bge-reranker-base",
			"author": "BAAI",
			"task": "text-classification",
			"description": "\"Different from embedding model, reranker uses question and document as input and directly output similarity instead of embedding. You can get a relevance score by inputting query and passage to the reranker. And the score can be mapped to a float value in [0,1] by sigmoid function.\\n\\n\"",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.003,
						"neurons": 283,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.003,
					"input_neurons_per_million": 283
				},
				"display": "$0.003 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 35335689,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-reranker-base/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/run"
			],
			"aliases": [
				"@cf/baai/bge-reranker-base",
				"bge-reranker-base"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 29
			}
		},
		{
			"id": "@cf/baai/bge-small-en-v1.5",
			"name": "bge-small-en-v1.5",
			"author": "BAAI",
			"task": "text-embeddings",
			"description": "BAAI general embedding (Small) model that transforms any given text into a 384-dimensional vector",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.02,
						"neurons": 1841,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.02,
					"input_neurons_per_million": 1841
				},
				"display": "$0.02 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 5431830,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/bge-small-en-v1.5/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/embeddings",
				"/v1/run"
			],
			"aliases": [
				"@cf/baai/bge-small-en-v1.5",
				"bge-small-en-v1.5"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 30
			}
		},
		{
			"id": "@cf/google/embeddinggemma-300m",
			"name": "embeddinggemma-300m",
			"author": "Google",
			"task": "text-embeddings",
			"description": "EmbeddingGemma is a 300M parameter, state-of-the-art for its size, open embedding model from Google, built from Gemma 3 (with T5Gemma initialization) and the same research and technology used to create Gemini models. EmbeddingGemma produces vector representations of text, making it well-suited for search and retrieval tasks, including classification, clustering, and semantic similarity search. This model was trained with data in 100+ spoken languages.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/embeddinggemma-300m/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/embeddings",
				"/v1/run"
			],
			"aliases": [
				"@cf/google/embeddinggemma-300m",
				"embeddinggemma-300m"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 31
			}
		},
		{
			"id": "@cf/huggingface/distilbert-sst-2-int8",
			"name": "distilbert-sst-2-int8",
			"author": "HuggingFace",
			"task": "text-classification",
			"description": "Distilled BERT model that was finetuned on SST-2 for sentiment classification",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.026,
						"neurons": 2394,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.026,
					"input_neurons_per_million": 2394
				},
				"display": "$0.026 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 4177109,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/distilbert-sst-2-int8/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/run"
			],
			"aliases": [
				"@cf/huggingface/distilbert-sst-2-int8",
				"distilbert-sst-2-int8"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 32
			}
		},
		{
			"id": "@cf/lykon/dreamshaper-8-lcm",
			"name": "dreamshaper-8-lcm",
			"author": "lykon",
			"task": "text-to-image",
			"description": "Stable Diffusion model that has been fine-tuned to be better at photorealism without sacrificing range.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/dreamshaper-8-lcm/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/lykon/dreamshaper-8-lcm",
				"dreamshaper-8-lcm"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 33
			}
		},
		{
			"id": "@cf/black-forest-labs/flux-1-schnell",
			"name": "flux-1-schnell",
			"author": "Black Forest Labs",
			"task": "text-to-image",
			"description": "\"FLUX.1 [schnell] is a 12 billion parameter rectified flow transformer capable of generating images from text descriptions. \"",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "image_tile",
						"usd": 0.0000528,
						"neurons": 4.8,
						"unit": "per 512x512 tile"
					},
					{
						"kind": "step",
						"usd": 0.0001056,
						"neurons": 9.6,
						"unit": "per step"
					}
				],
				"tokens": {},
				"display": "$0.0000528 / tile · $0.0001056 / step",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/black-forest-labs/flux-1-schnell",
				"flux-1-schnell"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 34
			}
		},
		{
			"id": "@cf/black-forest-labs/flux-2-dev",
			"name": "flux-2-dev",
			"author": "Black Forest Labs",
			"task": "text-to-image",
			"description": "FLUX.2 [dev] is an image model from Black Forest Labs where you can generate highly realistic and detailed images, with multi-reference support.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_image_tile_step",
						"usd": 0.00021,
						"neurons": 18.75,
						"unit": "per input 512x512 tile, per step"
					},
					{
						"kind": "output_image_tile_step",
						"usd": 0.00041,
						"neurons": 37.5,
						"unit": "per output 512x512 tile, per step"
					}
				],
				"tokens": {},
				"display": "$0.00021 / input tile/step · $0.00041 / output tile/step",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/flux-2-dev/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/black-forest-labs/flux-2-dev",
				"flux-2-dev"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 35
			}
		},
		{
			"id": "@cf/leonardo/lucid-origin",
			"name": "lucid-origin",
			"author": "Leonardo",
			"task": "text-to-image",
			"description": "\"Lucid Origin from Leonardo.AI is their most adaptable and prompt-responsive model to date. Whether you're generating images with sharp graphic design, stunning full-HD renders, or highly specific creative direction, it adheres closely to your prompts, renders text with accuracy, and supports a wide array of visual styles and aesthetics – from stylized concept art to crisp product mockups.\\n\"",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "image_tile",
						"usd": 0.006996,
						"neurons": 636,
						"unit": "per 512x512 tile"
					},
					{
						"kind": "step",
						"usd": 0.000132,
						"neurons": 12,
						"unit": "per step"
					}
				],
				"tokens": {},
				"display": "$0.006996 / tile · $0.000132 / step",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/lucid-origin/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/leonardo/lucid-origin",
				"lucid-origin"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 36
			}
		},
		{
			"id": "@cf/leonardo/phoenix-1.0",
			"name": "phoenix-1.0",
			"author": "Leonardo",
			"task": "text-to-image",
			"description": "Phoenix 1.0 is a model by Leonardo.Ai that generates images with exceptional prompt adherence and coherent text.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "image_tile",
						"usd": 0.00583,
						"neurons": 530,
						"unit": "per 512x512 tile"
					},
					{
						"kind": "step",
						"usd": 0.00011,
						"neurons": 10,
						"unit": "per step"
					}
				],
				"tokens": {},
				"display": "$0.00583 / tile · $0.00011 / step",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/phoenix-1.0/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/leonardo/phoenix-1.0",
				"phoenix-1.0"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 37
			}
		},
		{
			"id": "@cf/pipecat-ai/smart-turn-v2",
			"name": "smart-turn-v2",
			"author": "Pipecat",
			"task": "dumb-pipe",
			"description": "An open source, community-driven, native audio turn detection model in 2nd version",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "audio_minute",
						"usd": 0.00033795,
						"neurons": 0.51,
						"unit": "per audio minute input"
					}
				],
				"tokens": {},
				"display": "$0.00033795 / audio minute",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/smart-turn-v2/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/run"
			],
			"aliases": [
				"@cf/pipecat-ai/smart-turn-v2",
				"smart-turn-v2"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 38
			}
		},
		{
			"id": "@cf/runwayml/stable-diffusion-v1-5-inpainting",
			"name": "stable-diffusion-v1-5-inpainting",
			"author": "RunwayML",
			"task": "text-to-image",
			"description": "Stable Diffusion Inpainting is a latent text-to-image diffusion model capable of generating photo-realistic images given any text input, with the extra capability of inpainting the pictures by using a mask.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-inpainting/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/runwayml/stable-diffusion-v1-5-inpainting",
				"stable-diffusion-v1-5-inpainting"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 39
			}
		},
		{
			"id": "@cf/microsoft/resnet-50",
			"name": "resnet-50",
			"author": "Microsoft",
			"task": "image-classification",
			"description": "50 layers deep image classification CNN trained on more than 1M images from ImageNet",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "image",
						"usd": 2.51,
						"neurons": 228055,
						"unit": "per M images"
					}
				],
				"tokens": {},
				"display": "$2.51 / image",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/resnet-50/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/run"
			],
			"aliases": [
				"@cf/microsoft/resnet-50",
				"resnet-50"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 40
			}
		},
		{
			"id": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
			"name": "stable-diffusion-xl-base-1.0",
			"author": "Stability.ai",
			"task": "text-to-image",
			"description": "Diffusion-based text-to-image generative model by Stability AI. Generates and modify images based on text prompts.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-base-1.0/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/stabilityai/stable-diffusion-xl-base-1.0",
				"stable-diffusion-xl-base-1.0"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 41
			}
		},
		{
			"id": "@cf/bytedance/stable-diffusion-xl-lightning",
			"name": "stable-diffusion-xl-lightning",
			"author": "ByteDance",
			"task": "text-to-image",
			"description": "SDXL-Lightning is a lightning-fast text-to-image generation model. It can generate high-quality 1024px images in a few steps.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-lightning/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/bytedance/stable-diffusion-xl-lightning",
				"stable-diffusion-xl-lightning"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 37.3,
				"tier": "C",
				"basis": [
					"size unknown",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 40,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 42
			}
		},
		{
			"id": "@cf/openai/gpt-oss-20b",
			"name": "gpt-oss-20b",
			"author": "OpenAI",
			"task": "text-generation",
			"description": "OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-20b is for lower latency, and local or specialized use-cases.",
			"context_window": 128000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.2,
						"neurons": 18182,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.3,
						"neurons": 27273,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.2,
					"input_neurons_per_million": 18182,
					"output_usd_per_million": 0.3,
					"output_neurons_per_million": 27273
				},
				"display": "$0.2 / input · $0.3 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 366663,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/openai/gpt-oss-20b",
				"gpt-oss-20b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 36.3,
				"tier": "C",
				"basis": [
					"20B parameters",
					"128k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 68,
					"context": 63,
					"recency": 45,
					"price": 31,
					"override": null
				},
				"rank": 43
			}
		},
		{
			"id": "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
			"name": "deepseek-r1-distill-qwen-32b",
			"author": "DeepSeek",
			"task": "text-generation",
			"description": "DeepSeek-R1-Distill-Qwen-32B is a model distilled from DeepSeek-R1 based on Qwen2.5. It outperforms OpenAI-o1-mini across various benchmarks, achieving new state-of-the-art results for dense models.",
			"context_window": 80000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.497,
						"neurons": 45170,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 4.881,
						"neurons": 443756,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.497,
					"input_neurons_per_million": 45170,
					"output_usd_per_million": 4.881,
					"output_neurons_per_million": 443756
				},
				"display": "$0.497 / input · $4.881 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 22534,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/deepseek-r1-distill-qwen-32b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
				"deepseek-r1-distill-qwen-32b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 35.4,
				"tier": "C",
				"basis": [
					"32B parameters",
					"80k context",
					"reasoning",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 50,
					"context": 54,
					"recency": 45,
					"price": 80,
					"override": null
				},
				"rank": 44
			}
		},
		{
			"id": "@cf/swiss-ai/apertus-v1.5-8b",
			"name": "apertus-v1.5-8b",
			"author": "swiss-ai",
			"task": "text-generation",
			"description": "\"Apertus 1.5 is an 8B parameter language model designed to advance the state of multilingual, multimodal, fully open, and transparent AI. The models support a wide range of languages, handle contexts of up to 262,144 tokens, and it uses only fully open training data whilst delivering performance comparable to other models of similar size. For access, please fill out this form: https://forms.gle/kgvmkr6ucHN3xNuH6\"",
			"context_window": 262144,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": true
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/apertus-v1.5-8b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/swiss-ai/apertus-v1.5-8b",
				"apertus-v1.5-8b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 34.6,
				"tier": "D",
				"basis": [
					"8B parameters",
					"262k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 48,
					"context": 76,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 45
			}
		},
		{
			"id": "@cf/moondream/moondream3.1-9B-A2B",
			"name": "moondream3.1-9B-A2B",
			"author": "moondream",
			"task": "image-to-text",
			"description": "Moondream 3 is a fast, efficient 9B mixture-of-experts vision language model (2B active parameters) that delivers frontier-level visual reasoning for tasks like object detection, pointing, OCR, and structured output.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"image"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": true,
				"structured_output": true,
				"vision": true,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.3,
						"neurons": 27273,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1,
						"neurons": 90909,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.3,
					"input_neurons_per_million": 27273,
					"output_usd_per_million": 1,
					"output_neurons_per_million": 90909
				},
				"display": "$0.3 / input · $1 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 110000,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/moondream3.1-9B-A2B/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/run"
			],
			"aliases": [
				"@cf/moondream/moondream3.1-9B-A2B",
				"moondream3.1-9B-A2B"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 33.5,
				"tier": "D",
				"basis": [
					"2B active",
					"context unknown",
					"reasoning",
					"vision",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 68,
					"context": 30,
					"recency": 45,
					"price": 53,
					"override": null
				},
				"rank": 46
			}
		},
		{
			"id": "@cf/meta/llama-4-scout-17b-16e-instruct",
			"name": "llama-4-scout-17b-16e-instruct",
			"author": "Meta",
			"task": "text-generation",
			"description": "Meta's Llama 4 Scout is a 17 billion parameter model with 16 experts that is natively multimodal. These models leverage a mixture-of-experts architecture to offer industry-leading performance in text and image understanding.",
			"context_window": 131000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.27,
						"neurons": 24545,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.85,
						"neurons": 77273,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.27,
					"input_neurons_per_million": 24545,
					"output_usd_per_million": 0.85,
					"output_neurons_per_million": 77273
				},
				"display": "$0.27 / input · $0.85 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 129411,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/meta/llama-4-scout-17b-16e-instruct",
				"llama-4-scout-17b-16e-instruct"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 33.2,
				"tier": "D",
				"basis": [
					"17B parameters",
					"131k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 48,
					"context": 63,
					"recency": 45,
					"price": 50,
					"override": null
				},
				"rank": 47
			}
		},
		{
			"id": "@cf/meta/llama-3.2-11b-vision-instruct",
			"name": "llama-3.2-11b-vision-instruct",
			"author": "Meta",
			"task": "text-generation",
			"description": "\" The Llama 3.2-Vision instruction-tuned models are optimized for visual recognition, image reasoning, captioning, and answering general questions about an image.\"",
			"context_window": 128000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.049,
						"neurons": 4410,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.676,
						"neurons": 61493,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.049,
					"input_neurons_per_million": 4410,
					"output_usd_per_million": 0.676,
					"output_neurons_per_million": 61493
				},
				"display": "$0.049 / input · $0.676 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 162620,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/meta/llama-3.2-11b-vision-instruct",
				"llama-3.2-11b-vision-instruct"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 33.2,
				"tier": "D",
				"basis": [
					"11B parameters",
					"128k context",
					"reasoning",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 50,
					"context": 63,
					"recency": 45,
					"price": 46,
					"override": null
				},
				"rank": 48
			}
		},
		{
			"id": "@cf/qwen/qwen3-30b-a3b-fp8",
			"name": "qwen3-30b-a3b-fp8",
			"author": "Qwen",
			"task": "text-generation",
			"description": "Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models. Built upon extensive training, Qwen3 delivers groundbreaking advancements in reasoning, instruction-following, agent capabilities, and multilingual support.",
			"context_window": 32768,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": true
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.051,
						"neurons": 4625,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.335,
						"neurons": 30475,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.051,
					"input_neurons_per_million": 4625,
					"output_usd_per_million": 0.335,
					"output_neurons_per_million": 30475
				},
				"display": "$0.051 / input · $0.335 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 328137,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/qwen/qwen3-30b-a3b-fp8",
				"qwen3-30b-a3b-fp8"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 32.8,
				"tier": "D",
				"basis": [
					"3B active",
					"33k context",
					"reasoning",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 68,
					"context": 38,
					"recency": 45,
					"price": 33,
					"override": null
				},
				"rank": 49
			}
		},
		{
			"id": "@cf/mistralai/mistral-small-3.1-24b-instruct",
			"name": "mistral-small-3.1-24b-instruct",
			"author": "MistralAI",
			"task": "text-generation",
			"description": "Building upon Mistral Small 3 (2501), Mistral Small 3.1 (2503) adds state-of-the-art vision understanding and enhances long context capabilities up to 128k tokens without compromising text performance. With 24 billion parameters, this model achieves top-tier capabilities in both text and vision tasks.",
			"context_window": 128000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.351,
						"neurons": 31876,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.555,
						"neurons": 50488,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.351,
					"input_neurons_per_million": 31876,
					"output_usd_per_million": 0.555,
					"output_neurons_per_million": 50488
				},
				"display": "$0.351 / input · $0.555 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 198066,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/mistralai/mistral-small-3.1-24b-instruct",
				"mistral-small-3.1-24b-instruct"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 32.4,
				"tier": "D",
				"basis": [
					"24B parameters",
					"128k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 48,
					"context": 63,
					"recency": 45,
					"price": 42,
					"override": null
				},
				"rank": 50
			}
		},
		{
			"id": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
			"name": "llama-3.3-70b-instruct-fp8-fast",
			"author": "Meta",
			"task": "text-generation",
			"description": "Llama 3.3 70B quantized to fp8 precision, optimized to be faster.",
			"context_window": 24000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.293,
						"neurons": 26668,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 2.253,
						"neurons": 204805,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.293,
					"input_neurons_per_million": 26668,
					"output_usd_per_million": 2.253,
					"output_neurons_per_million": 204805
				},
				"display": "$0.293 / input · $2.253 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 48826,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
				"llama-3.3-70b-instruct-fp8-fast"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 30.3,
				"tier": "D",
				"basis": [
					"70B parameters",
					"24k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 48,
					"context": 32,
					"recency": 45,
					"price": 67,
					"override": null
				},
				"rank": 51
			}
		},
		{
			"id": "@cf/qwen/qwq-32b",
			"name": "qwq-32b",
			"author": "Qwen",
			"task": "text-generation",
			"description": "QwQ is the reasoning model of the Qwen series. Compared with conventional instruction-tuned models, QwQ, which is capable of thinking and reasoning, can achieve significantly enhanced performance in downstream tasks, especially hard problems. QwQ-32B is the medium-sized reasoning model, which is capable of achieving competitive performance against state-of-the-art reasoning models, e.g., DeepSeek-R1, o1-mini.",
			"context_window": 24000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": true,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.66,
						"neurons": 60000,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1,
						"neurons": 90909,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.66,
					"input_neurons_per_million": 60000,
					"output_usd_per_million": 1,
					"output_neurons_per_million": 90909
				},
				"display": "$0.66 / input · $1 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 110000,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/qwq-32b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/qwen/qwq-32b",
				"qwq-32b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 29.4,
				"tier": "D",
				"basis": [
					"32B parameters",
					"24k context",
					"reasoning",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 50,
					"context": 32,
					"recency": 45,
					"price": 53,
					"override": null
				},
				"rank": 52
			}
		},
		{
			"id": "@cf/utter-project/eurollm-9b-it",
			"name": "eurollm-9b-it",
			"author": "utter-project",
			"task": "text-generation",
			"description": "\"EuroLLM-9B is a 9B parameter model trained on 4 trillion tokens divided across the considered languages and several data sources: Web data, parallel data (en-xx and xx-en), and high-quality datasets. For access, please fill out this form: https://forms.gle/kgvmkr6ucHN3xNuH6\"",
			"context_window": 32000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": true,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/eurollm-9b-it/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/utter-project/eurollm-9b-it",
				"eurollm-9b-it"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 28.9,
				"tier": "D",
				"basis": [
					"9B parameters",
					"32k context",
					"tools",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 48,
					"context": 38,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 53
			}
		},
		{
			"id": "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
			"name": "gemma-sea-lion-v4-27b-it",
			"author": "aisingapore",
			"task": "text-generation",
			"description": "SEA-LION stands for Southeast Asian Languages In One Network, which is a collection of Large Language Models (LLMs) which have been pretrained and instruct-tuned for the Southeast Asia (SEA) region.",
			"context_window": 128000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.351,
						"neurons": 31876,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.555,
						"neurons": 50488,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.351,
					"input_neurons_per_million": 31876,
					"output_usd_per_million": 0.555,
					"output_neurons_per_million": 50488
				},
				"display": "$0.351 / input · $0.555 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 198066,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/gemma-sea-lion-v4-27b-it/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/aisingapore/gemma-sea-lion-v4-27b-it",
				"gemma-sea-lion-v4-27b-it"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 27.9,
				"tier": "D",
				"basis": [
					"27B parameters",
					"128k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 63,
					"recency": 45,
					"price": 42,
					"override": null
				},
				"rank": 54
			}
		},
		{
			"id": "@cf/cloudflare/clef",
			"name": "clef",
			"author": "Cloudflare",
			"task": "text-generation",
			"description": "Clef is a 27B multimodal decision model that turns a state and a schema of typed questions into decisions. It reads the state as text, JSON, images, or video, and returns a probability for every allowed option of every question.",
			"context_window": 65536,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.24,
						"neurons": 21818,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.24,
					"input_neurons_per_million": 21818
				},
				"display": "$0.24 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 458337,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/clef/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/cloudflare/clef",
				"clef"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 26.3,
				"tier": "D",
				"basis": [
					"27B parameters",
					"66k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 51,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 55
			}
		},
		{
			"id": "@cf/cloudflare/clef-omni",
			"name": "clef-omni",
			"author": "Cloudflare",
			"task": "text-generation",
			"description": "Clef-omni is a multimodal decision model built on a 30B-parameter mixture-of-experts (3B active) backbone. It turns a state and a schema of typed questions into decisions, reads the state as text, JSON, images, audio, or video, and returns a probability for every allowed option of every question.",
			"context_window": 64000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.15,
						"neurons": 13636,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.15,
					"input_neurons_per_million": 13636
				},
				"display": "$0.15 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 733352,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/clef-omni/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/cloudflare/clef-omni",
				"clef-omni"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 26.3,
				"tier": "D",
				"basis": [
					"30B parameters",
					"64k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 50,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 56
			}
		},
		{
			"id": "@cf/llava-hf/llava-1.5-7b-hf",
			"name": "llava-1.5-7b-hf",
			"author": "llava-hf",
			"task": "image-to-text",
			"description": "LLaVA is an open-source chatbot trained by fine-tuning LLaMA/Vicuna on GPT-generated multimodal instruction-following data. It is an auto-regressive language model, based on the transformer architecture.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"image"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": true,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llava-1.5-7b-hf/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/run"
			],
			"aliases": [
				"@cf/llava-hf/llava-1.5-7b-hf",
				"llava-1.5-7b-hf"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 25.8,
				"tier": "D",
				"basis": [
					"7B parameters",
					"context unknown",
					"vision",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 40,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 57
			}
		},
		{
			"id": "@cf/meta/llama-3.2-3b-instruct",
			"name": "llama-3.2-3b-instruct",
			"author": "Meta",
			"task": "text-generation",
			"description": "The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.",
			"context_window": 80000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": true
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.051,
						"neurons": 4625,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.335,
						"neurons": 30475,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.051,
					"input_neurons_per_million": 4625,
					"output_usd_per_million": 0.335,
					"output_neurons_per_million": 30475
				},
				"display": "$0.051 / input · $0.335 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 328137,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.2-3b-instruct/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/meta/llama-3.2-3b-instruct",
				"llama-3.2-3b-instruct"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 25.7,
				"tier": "D",
				"basis": [
					"3B parameters",
					"80k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 54,
					"recency": 45,
					"price": 33,
					"override": null
				},
				"rank": 58
			}
		},
		{
			"id": "@cf/qwen/qwen2.5-coder-32b-instruct",
			"name": "qwen2.5-coder-32b-instruct",
			"author": "Qwen",
			"task": "text-generation",
			"description": "\"Qwen2.5-Coder is the latest series of Code-Specific Qwen large language models (formerly known as CodeQwen). As of now, Qwen2.5-Coder has covered six mainstream model sizes, 0.5, 1.5, 3, 7, 14, 32 billion parameters, to meet the needs of different developers. Qwen2.5-Coder brings the following improvements upon CodeQwen1.5:\"",
			"context_window": 32768,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.66,
						"neurons": 60000,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 1,
						"neurons": 90909,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.66,
					"input_neurons_per_million": 60000,
					"output_usd_per_million": 1,
					"output_neurons_per_million": 90909
				},
				"display": "$0.66 / input · $1 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 110000,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/qwen2.5-coder-32b-instruct/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/qwen/qwen2.5-coder-32b-instruct",
				"qwen2.5-coder-32b-instruct"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 25.2,
				"tier": "D",
				"basis": [
					"32B parameters",
					"33k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 38,
					"recency": 45,
					"price": 53,
					"override": null
				},
				"rank": 59
			}
		},
		{
			"id": "@cf/meta/llama-3.2-1b-instruct",
			"name": "llama-3.2-1b-instruct",
			"author": "Meta",
			"task": "text-generation",
			"description": "The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.",
			"context_window": 60000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": true
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.027,
						"neurons": 2457,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.201,
						"neurons": 18252,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.027,
					"input_neurons_per_million": 2457,
					"output_usd_per_million": 0.201,
					"output_neurons_per_million": 18252
				},
				"display": "$0.027 / input · $0.201 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 547885,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.2-1b-instruct/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/meta/llama-3.2-1b-instruct",
				"llama-3.2-1b-instruct"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 24,
				"tier": "D",
				"basis": [
					"1B parameters",
					"60k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 49,
					"recency": 45,
					"price": 24,
					"override": null
				},
				"rank": 60
			}
		},
		{
			"id": "@cf/meta/llama-guard-3-8b",
			"name": "llama-guard-3-8b",
			"author": "Meta",
			"task": "text-generation",
			"description": "Llama Guard 3 is a Llama-3.1-8B pretrained model, fine-tuned for content safety classification. Similar to previous versions, it can be used to classify content in both LLM inputs (prompt classification) and in LLM responses (response classification). It acts as an LLM – it generates text in its output that indicates whether a given prompt or response is safe or unsafe, and if unsafe, it also lists the content categories violated.",
			"context_window": 131072,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.484,
						"neurons": 44003,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.03,
						"neurons": 2730,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.484,
					"input_neurons_per_million": 44003,
					"output_usd_per_million": 0.03,
					"output_neurons_per_million": 2730
				},
				"display": "$0.484 / input · $0.03 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 3663003,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-guard-3-8b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/meta/llama-guard-3-8b",
				"llama-guard-3-8b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 23.7,
				"tier": "D",
				"basis": [
					"8B parameters",
					"131k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 63,
					"recency": 45,
					"price": 0,
					"override": null
				},
				"rank": 61
			}
		},
		{
			"id": "@cf/cloudflare/clef-flash",
			"name": "clef-flash",
			"author": "Cloudflare",
			"task": "text-generation",
			"description": "Clef-flash is a fast 9B multimodal decision model that turns a state and a schema of typed questions into decisions. It reads the state as text, JSON, images, or video, and returns a probability for every allowed option of every question.",
			"context_window": 24576,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.038,
						"neurons": 3455,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.038,
					"input_neurons_per_million": 3455
				},
				"display": "$0.038 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 2894356,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/clef-flash/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/cloudflare/clef-flash",
				"clef-flash"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 23.7,
				"tier": "D",
				"basis": [
					"9B parameters",
					"25k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 33,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 62
			}
		},
		{
			"id": "@cf/black-forest-labs/flux-2-klein-9b",
			"name": "flux-2-klein-9b",
			"author": "Black Forest Labs",
			"task": "text-to-image",
			"description": "FLUX.2 [klein] 9B is a 9 billion parameter model that can generate images from text descriptions and supports multi-reference editing capabilities.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "image_megapixel",
						"usd": 0.015,
						"neurons": 1363.64,
						"unit": "per first MP (1024x1024)"
					},
					{
						"kind": "image_megapixel",
						"usd": 0.002,
						"neurons": 181.82,
						"unit": "per subsequent MP"
					},
					{
						"kind": "image",
						"usd": 0.002,
						"neurons": 181.82,
						"unit": "per input image MP"
					}
				],
				"tokens": {},
				"display": "$0.015 / MP · $0.002 / MP · $0.002 / image",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/flux-2-klein-9b/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/black-forest-labs/flux-2-klein-9b",
				"flux-2-klein-9b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 23.3,
				"tier": "D",
				"basis": [
					"9B parameters",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 63
			}
		},
		{
			"id": "@cf/black-forest-labs/flux-2-klein-4b",
			"name": "flux-2-klein-4b",
			"author": "Black Forest Labs",
			"task": "text-to-image",
			"description": "FLUX.2 [klein] is an ultra-fast, distilled image model. It unifies image generation and editing in a single model, delivering state-of-the-art quality enabling interactive workflows, real-time previews, and latency-critical applications.",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"image"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "image_tile",
						"usd": 0.000059,
						"neurons": 5.37,
						"unit": "per input 512x512 tile"
					},
					{
						"kind": "image_tile",
						"usd": 0.000287,
						"neurons": 26.05,
						"unit": "per output 512x512 tile"
					}
				],
				"tokens": {},
				"display": "$0.000059 / tile · $0.000287 / tile",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/images/generations",
				"/v1/run"
			],
			"aliases": [
				"@cf/black-forest-labs/flux-2-klein-4b",
				"flux-2-klein-4b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 23.3,
				"tier": "D",
				"basis": [
					"4B parameters",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 64
			}
		},
		{
			"id": "@cf/pfnet/plamo-embedding-1b",
			"name": "plamo-embedding-1b",
			"author": "pfnet",
			"task": "text-embeddings",
			"description": "\"PLaMo-Embedding-1B is a Japanese text embedding model developed by Preferred Networks, Inc.\\n\\nIt can convert Japanese text input into numerical vectors and can be used for a wide range of applications, including information retrieval, text classification, and clustering.\"",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.019,
						"neurons": 1689,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.019,
					"input_neurons_per_million": 1689
				},
				"display": "$0.019 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 5920663,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/plamo-embedding-1b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/embeddings",
				"/v1/run"
			],
			"aliases": [
				"@cf/pfnet/plamo-embedding-1b",
				"plamo-embedding-1b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 23.3,
				"tier": "D",
				"basis": [
					"1B parameters",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 65
			}
		},
		{
			"id": "@cf/meta/llama-3.1-8b-instruct-fp8",
			"name": "llama-3.1-8b-instruct-fp8",
			"author": "Meta",
			"task": "text-generation",
			"description": "Llama 3.1 8B quantized to FP8 precision",
			"context_window": 32000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.152,
						"neurons": 13778,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.287,
						"neurons": 26128,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.152,
					"input_neurons_per_million": 13778,
					"output_usd_per_million": 0.287,
					"output_neurons_per_million": 26128
				},
				"display": "$0.152 / input · $0.287 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 382731,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/meta/llama-3.1-8b-instruct-fp8",
				"llama-3.1-8b-instruct-fp8"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 23,
				"tier": "D",
				"basis": [
					"8B parameters",
					"32k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 38,
					"recency": 45,
					"price": 31,
					"override": null
				},
				"rank": 66
			}
		},
		{
			"id": "@cf/mistral/mistral-7b-instruct-v0.2-lora",
			"name": "mistral-7b-instruct-v0.2-lora",
			"author": "MistralAI",
			"task": "text-generation",
			"description": "The Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2.",
			"context_window": 15000,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/mistral-7b-instruct-v0.2-lora/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/mistral/mistral-7b-instruct-v0.2-lora",
				"mistral-7b-instruct-v0.2-lora"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 22.3,
				"tier": "D",
				"basis": [
					"7B parameters",
					"15k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 24,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 67
			}
		},
		{
			"id": "@cf/ai4bharat/indictrans2-en-indic-1B",
			"name": "indictrans2-en-indic-1B",
			"author": "ai4bharat",
			"task": "translation",
			"description": "IndicTrans2 is the first open-source transformer-based multilingual NMT model that supports high-quality translations across all the 22 scheduled Indic languages",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": true
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.342,
						"neurons": 31050,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.342,
						"neurons": 31050,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.342,
					"input_neurons_per_million": 31050,
					"output_usd_per_million": 0.342,
					"output_neurons_per_million": 31050
				},
				"display": "$0.342 / input · $0.342 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 322061,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/indictrans2-en-indic-1B/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/run"
			],
			"aliases": [
				"@cf/ai4bharat/indictrans2-en-indic-1B",
				"indictrans2-en-indic-1B"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 22.1,
				"tier": "D",
				"basis": [
					"1B parameters",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 34,
					"override": null
				},
				"rank": 68
			}
		},
		{
			"id": "@cf/meta/m2m100-1.2b",
			"name": "m2m100-1.2b",
			"author": "Meta",
			"task": "translation",
			"description": "Multilingual encoder-decoder (seq-to-seq) model trained for Many-to-Many multilingual translation",
			"context_window": null,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": true
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.342,
						"neurons": 31050,
						"unit": "per M input tokens"
					},
					{
						"kind": "output_token",
						"usd": 0.342,
						"neurons": 31050,
						"unit": "per M output tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.342,
					"input_neurons_per_million": 31050,
					"output_usd_per_million": 0.342,
					"output_neurons_per_million": 31050
				},
				"display": "$0.342 / input · $0.342 / output",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 322061,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/",
			"openai_compatible": false,
			"endpoints": [
				"/v1/run"
			],
			"aliases": [
				"@cf/meta/m2m100-1.2b",
				"m2m100-1.2b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 22.1,
				"tier": "D",
				"basis": [
					"1.2B parameters",
					"context unknown",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 30,
					"recency": 45,
					"price": 34,
					"override": null
				},
				"rank": 69
			}
		},
		{
			"id": "@cf/google/gemma-2b-it-lora",
			"name": "gemma-2b-it-lora",
			"author": "Google",
			"task": "text-generation",
			"description": "This is a Gemma-2B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.",
			"context_window": 8192,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/gemma-2b-it-lora/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/google/gemma-2b-it-lora",
				"gemma-2b-it-lora"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 20.7,
				"tier": "D",
				"basis": [
					"2B parameters",
					"8k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 13,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 70
			}
		},
		{
			"id": "@cf/meta-llama/llama-2-7b-chat-hf-lora",
			"name": "llama-2-7b-chat-hf-lora",
			"author": "Meta",
			"task": "text-generation",
			"description": "\"This is a Llama2 base model that Cloudflare dedicated for inference with LoRA adapters. Llama 2 is a collection of pretrained and fine-tuned generative text models ranging in scale from 7 billion to 70 billion parameters. This is the repository for the 7B fine-tuned model, optimized for dialogue use cases and converted for the Hugging Face Transformers format. \"",
			"context_window": 8192,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/llama-2-7b-chat-hf-lora/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/meta-llama/llama-2-7b-chat-hf-lora",
				"llama-2-7b-chat-hf-lora"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 20.7,
				"tier": "D",
				"basis": [
					"7B parameters",
					"8k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 13,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 71
			}
		},
		{
			"id": "@cf/qwen/qwen3-embedding-0.6b",
			"name": "qwen3-embedding-0.6b",
			"author": "Qwen",
			"task": "text-embeddings",
			"description": "\"The Qwen3 Embedding model series is the latest proprietary model of the Qwen family, specifically designed for text embedding and ranking tasks. \"",
			"context_window": 8192,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [
					{
						"kind": "input_token",
						"usd": 0.012,
						"neurons": 1075,
						"unit": "per M input tokens"
					}
				],
				"tokens": {
					"input_usd_per_million": 0.012,
					"input_neurons_per_million": 1075
				},
				"display": "$0.012 / input",
				"source": "https://developers.cloudflare.com/workers-ai/platform/pricing/index.md"
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": 9302325,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/qwen3-embedding-0.6b/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/embeddings",
				"/v1/run"
			],
			"aliases": [
				"@cf/qwen/qwen3-embedding-0.6b",
				"qwen3-embedding-0.6b"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 20.7,
				"tier": "D",
				"basis": [
					"0.6B parameters",
					"8k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 13,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 72
			}
		},
		{
			"id": "@cf/google/gemma-7b-it-lora",
			"name": "gemma-7b-it-lora",
			"author": "Google",
			"task": "text-generation",
			"description": "\"  This is a Gemma-7B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.\"",
			"context_window": 3500,
			"max_output_tokens": null,
			"modalities": {
				"input": [
					"text"
				],
				"output": [
					"text"
				]
			},
			"capabilities": {
				"function_calling": false,
				"reasoning": false,
				"structured_output": false,
				"vision": false,
				"audio_input": false,
				"audio_output": false,
				"streaming": true,
				"multilingual": false
			},
			"pricing": {
				"items": [],
				"tokens": {},
				"display": "—",
				"source": null
			},
			"requires_paid": false,
			"deprecated": false,
			"free": true,
			"free_daily_output_tokens": null,
			"created_at": null,
			"created_unix": null,
			"docs_url": "https://developers.cloudflare.com/workers-ai/models/gemma-7b-it-lora/",
			"openai_compatible": true,
			"endpoints": [
				"/v1/chat/completions",
				"/v1/run"
			],
			"aliases": [
				"@cf/google/gemma-7b-it-lora",
				"gemma-7b-it-lora"
			],
			"source": "docs-snapshot",
			"performance": {
				"score": 18.8,
				"tier": "D",
				"basis": [
					"7B parameters",
					"4k context",
					"heuristic score"
				],
				"components": {
					"size": 0,
					"capability": 30,
					"context": 0,
					"recency": 45,
					"price": 45,
					"override": null
				},
				"rank": 73
			}
		}
	]
};
