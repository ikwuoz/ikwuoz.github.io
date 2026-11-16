export interface PrimaryLink {
	label: string;
	href: string;
	external?: boolean;
}

export interface ProjectEntry {
	index: string;
	name: string;
	highlightTag: string;
	highlightAccent?: boolean;
	summary: string;
	architectureFocus: string;
	stack: string[];
	links: PrimaryLink[];
}

export interface ExperienceEntry {
	role: string;
	focus: string;
}

export const SITE_META = {
	moniker: 'Emmanuel Ikwuoma',
	roleTag: 'SOFTWARE ENGINEER // SMART CONTRACTS & DECENTRALIZED SYSTEMS',
	timezone: 'UTC+1',
	headline: 'Software Engineer',
	subheaderSegments: [
		{ text: 'building ', highlight: false },
		{ text: 'resilient smart contract architectures', highlight: true },
		{ text: ', ', highlight: false },
		{ text: 'AI-native protocol tooling', highlight: true },
		{ text: ', and ', highlight: false },
		{ text: 'decentralized infrastructure', highlight: true },
		{ text: '.', highlight: false },
	],
	subcopy:
		'Focused on EVM security, upgradeable contract patterns, and autonomous onchain agents. Currently contributing to open-source blockchain ecosystems and protocol engineering.',
	colophonNote:
		'TYPESET IN PLUS JAKARTA SANS & JETBRAINS MONO. BUILT WITH ASTRO & TAILWIND CSS.',
	contactNote:
		"I'm currently interested in building at the intersection of blockchain & finance, Agentic applications, research & collaboration.",
	statusText: 'AVAILABLE FOR PROTOCOL & SYSTEMS ENGINEERING',
} as const;

export const PRIMARY_LINKS: PrimaryLink[] = [
	{
		label: 'GITHUB',
		href: 'https://github.com/ikwuoz',
		external: true,
	},
	{
		label: 'X / TWITTER',
		href: 'https://x.com/nuel_ikwuoma',
		external: true,
	},
	{
		label: 'EMAIL',
		href: 'mailto:emmanuelikwuoma7@gmail.com',
		external: false,
	},
];

export const SELECTED_WORKS: ProjectEntry[] = [
	{
		index: '01',
		name: 'Sipx',
		highlightTag: 'AI INFERENCE INFRASTRUCTURE',
		summary:
			'Minimal proxy server enabling self-fulfilling, pay-per-token AI inference metering on Near AI Cloud.',
		architectureFocus:
			'Lightweight request proxying, cryptographic usage accounting, and low-overhead token settlement.',
		stack: ['Near AI', 'TypeScript / Rust', 'HTTP Proxy', 'Micropayments'],
		links: [
			{
				label: 'SOURCE',
				href: 'https://github.com/ikwuoz/sipx',
				external: true,
			},
			{
				label: 'LIVE',
				href: 'https://sipx-production.up.railway.app/playground',
				external: true,
			},
		],
	},
	{
		index: '02',
		name: 'DAO Intel',
		highlightTag: 'ONCHAIN AI GOVERNANCE',
		summary:
			'AI-powered proposal evaluation and autonomous delegation platform built for DAOs on GenLayer.',
		architectureFocus:
			'Leverages GenLayer intelligent contracts to analyze governance proposals against DAO mandates and execute informed voting delegation.',
		stack: ['GenLayer', 'Intelligent Contracts', 'Python', 'DAO Tooling'],
		links: [
			{
				label: 'SOURCE',
				href: 'https://github.com/ikwuoz/DAO-Intel',
				external: true,
			},
		],
	},
	{
		index: '03',
		name: 'Polyklaw',
		highlightTag: 'PREDICTION MARKET BOT',
		summary:
			'High-speed Telegram trading interface and execution bot tailored for Polymarket orderbooks.',
		architectureFocus:
			'Real-time market odds monitoring, streamlined trade execution via chat commands, and position tracking.',
		stack: ['Polymarket CLOB', 'Telegram API', 'Node.js / Python', 'Web3'],
		links: [
			{
				label: 'LIVE',
				href: 'https://t.me/polyclawtradeAI_bot',
				external: true,
			},
		],
	},
	{
		index: '04',
		name: 'Diamond with Rollback',
		highlightTag: 'ERC-2535 EXTENSION',
		summary:
			'An upgradeable smart contract template extending the EIP-2535 Diamond Standard with deterministic state and facet rollback safety.',
		architectureFocus:
			'Mitigates upgrade risk in modular multi-facet contracts by preserving prior facet cut histories for rapid recovery.',
		stack: ['Solidity', 'EIP-2535', 'Foundry', 'EVM'],
		links: [
			{
				label: 'SOURCE',
				href: 'https://github.com/ikwuoz/Diamond-With-Rollback',
				external: true,
			},
		],
	},
	{
		index: '05',
		name: 'Soundly',
		highlightTag: 'ETHGLOBAL WINNER',
		highlightAccent: true,
		summary:
			'Decentralized music streaming protocol built on Ethereum, enabling direct artist-to-listener value distribution and programmable royalty splits.',
		architectureFocus:
			'Smart contract payment routing, media streaming state management, and Web3 wallet integration.',
		stack: ['Solidity', 'Ethereum', 'EVM', 'TypeScript'],
		links: [
			{
				label: 'SOURCE',
				href: 'https://github.com/ikwuoz/soundly',
				external: true,
			},
		],
	},
];

export const EXPERIENCE_ENTRIES: ExperienceEntry[] = [
	{
		role: 'Solidity Engineer — Polytope Labs',
		focus:
			'Engineered and audited smart contracts supporting cross-chain interoperability and cryptographic verification protocols. Collaborated on protocol-level EVM integrations and gas-optimized contract architecture.',
	},
	{
		role: 'Independent Open-Source Contributor',
		focus:
			'Authored developer templates & docs, protocol tooling, and smart contract utilities across web3 ecosystems. Focused on reusable standards like ERC-2535 extensions, AI inference infrastructure and other onchain primitives.',
	},
	{
		role: 'Blockchain Tutor — BlockchainOAU',
		focus:
			'Mentored student developers in Solidity, EVM fundamentals, smart contract security, and decentralized application architecture. Led hands-on workshops onboarding new developers into Web3.',
	},
];
