// See https://kit.svelte.dev/docs/types#app

import type { Web3BaseProvider } from "web3";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	interface Window { ethereum: Web3BaseProvider; }

}

export { };
