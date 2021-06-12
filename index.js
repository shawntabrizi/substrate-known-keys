var { ApiPromise, WsProvider } = require('@polkadot/api');

async function main() {

	var args = process.argv;
	let option = args[2] || "";

	let network;
	switch(option.toLowerCase()) {
		case "":
		case "kusama":
			network = "wss://kusama-rpc.polkadot.io/";
			break;
		case "polkadot":
			network = "wss://rpc.polkadot.io/";
			break;
		case "local":
			network = "ws://127.0.0.1:9944";
			break;
		default:
			network = option;
	}

	const provider = new WsProvider(network, false);
	provider.connect();

	const api = await ApiPromise.create({ provider });

	// Get general information about the node we are connected to
	const [chain, nodeName, nodeVersion] = await Promise.all([
		api.rpc.system.chain(),
		api.rpc.system.name(),
		api.rpc.system.version()
	]);
	console.log(
		`Getting keys for ${chain} using ${nodeName} v${nodeVersion} @ ${network}`
	);

	// This is a list of the "well_known_keys" in Substrate
	let output = [{
			"name": ":code",
			"key": "0x3a636f6465"
		},
		{
			"name": ":heappages",
			"key": "0x3a686561707061676573"
		},
		{
			"name": ":extrinsic_index",
			"key": "0x3a65787472696e7369635f696e646578"
		},
		{
			"name": ":changes_trie",
			"key": "0x3a6368616e6765735f74726965"
		},
		{
			"name": ":child_storage:",
			"key": "0x3a6368696c645f73746f726167653a"
		}
	];

	for (module in api.query) {
		if (module == "substrate") { continue; }

		for (storage in api.query[module]) {
			let query = api.query[module][storage];
			try {
				output.push({
					"name": module + " " + storage,
					"key": query.key(),
				})
			} catch {
				output.push({
					"name": module + " " + storage,
					"prefix": query.keyPrefix(),
				})
			}
		}
	}

	output.sort(sortByModule);

	const fs = require('fs')
	fs.writeFileSync(
		('./known-keys.json').toLowerCase().replace(/\s/g, '-'),
		JSON.stringify(output, null, '  ')
	)

	provider.disconnect()
}

function sortByModule(a, b) {
	return a.name.localeCompare(b.name);
}

main().catch(console.error);
