import { Plugin } from 'obsidian';

export default class LLMConnectorPlugin extends Plugin {
	async onload() {
		console.log('Loading LLM Connector Plugin');
		
		// TODO: Initialize provider manager
		// TODO: Load settings
		// TODO: Expose public API
		// TODO: Add settings tab
	}

	onunload() {
		console.log('Unloading LLM Connector Plugin');
	}
}
