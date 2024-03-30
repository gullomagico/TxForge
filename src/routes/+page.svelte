<script lang="ts">
	import { onMount } from 'svelte';
	import {
		default as FunctionAbi,
		default as Web3,
		type AbiItem,
		type AbiFunctionFragment
	} from 'web3';

	let web3: Web3;
	const methodNameList: AbiFunctionFragment[] = [];

	let contractABI = '';
	let contractAddress = '';
	let methodSignatures: { [key: string]: AbiFunctionFragment } = {};
	let selectedMethod = '';
	let output = '';

	const methodIsView = (method: AbiFunctionFragment): boolean => {
		return method.stateMutability === 'view' || method.stateMutability === 'pure';
	};

	onMount(async () => {
		if (window.ethereum) {
			web3 = new Web3(window.ethereum);
			try {
				await window.ethereum.request({ method: 'eth_requestAccounts' });
			} catch (error) {
				console.error('User denied account access');
			}
		} else if (web3) {
			web3 = new Web3(web3.currentProvider);
		} else {
			console.error('No web3 detected. Install Metamask or use an Ethereum-compatible browser.');
		}
	});

	async function loadContract() {
		if (!web3) {
			console.error('Web3 not initialized.');
			return;
		}

		const contractABIJson = JSON.parse(contractABI) as AbiItem[];
		const contract = new web3.eth.Contract(contractABIJson, contractAddress);

		contractABIJson
			.filter((item) => item.type === 'function')
			.forEach((method) => {
				const functionFragment = method as AbiFunctionFragment;
				console.log('Method:', functionFragment);
				methodSignatures[functionFragment.name] = functionFragment;
			});

		// Visualizza i metodi raggruppati
		console.log('Metodi Raggruppati:', methodSignatures);
	}

	async function sendTransaction() {
		if (!web3) {
			console.error('Web3 not initialized.');
			return;
		}

		const contractABIJson = JSON.parse(contractABI) as AbiItem[];
		const contract = new web3.eth.Contract(contractABIJson, contractAddress);

		const method = methodSignatures[selectedMethod];
		const inputs = method.inputs ?? [];
		const inputValues = inputs.map((input) => {
			const inputElement = document.getElementById(input.name) as HTMLInputElement;
			return inputElement.value;
		});

		if (methodIsView(method)) {
			let result;
			try {
				result = await contract.methods[selectedMethod](...inputValues).call();
				output = JSON.stringify(result, null, 2);
			} catch (error) {
				console.error('Errore durante la chiamata al metodo:', error);
				output = JSON.stringify(error, null, 2);
			}
		} else {
			const tx = contract.methods[selectedMethod](...inputValues);
			const txData = tx.encodeABI();
			let txReceipt;
			try {
				txReceipt = await web3.eth.sendTransaction({
					to: contractAddress,
					data: txData,
					from: (await web3.eth.getAccounts())[0],
					gas: 0
				});

				console.log('Transazione inviata:', txReceipt);
				output = JSON.stringify(txReceipt, null, 2);
			} catch (error) {
				console.error("Errore durante l'invio della transazione:", error);
				output = JSON.stringify(error, null, 2);
			}

			console.log('Transazione inviata:', txReceipt);
		}
	}
</script>

<svelte:head>
	<title>TX Forge</title>
</svelte:head>

<main>
	<h1>Invia una Transazione</h1>
	<label for="contractABI">ABI del Contratto:</label>
	<textarea id="contractABI" bind:value={contractABI}></textarea><br />
	<label for="contractAddress">Indirizzo del Contratto:</label>
	<input type="text" id="contractAddress" bind:value={contractAddress} /><br />
	<button on:click={loadContract}>Carica Contratto</button>

	{#if Object.keys(methodSignatures).length > 0}
		<label for="methodSelect">Seleziona Metodo:</label>
		<select id="methodSelect" bind:value={selectedMethod}>
			{#each Object.keys(methodSignatures) as methodSignature}
				<option value={methodSignature}>{methodSignature}</option>
			{/each}
		</select>
	{/if}

	{#if selectedMethod}
		<h2>Dettagli Metodo</h2>
		<p>Nome: {methodSignatures[selectedMethod].name}</p>
		<!-- visualizza un input per ogni parametro di input -->
		{#each methodSignatures[selectedMethod].inputs ?? [] as input}
			<label for={input.name}>{input.name}:</label>
			<input type="text" id={input.name} /><br />
		{/each}
	{/if}

	<button on:click={sendTransaction}>Invia Transazione</button>

	<h2>Output</h2>
	<pre>{output}</pre>
</main>
