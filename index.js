var { ApiPromise, WsProvider } = require('@polkadot/api');
var { stringToHex } = require('@polkadot/util');
var { xxhashAsHex } = require('@polkadot/util-crypto');
const dictionary = require("./dictionary.json");

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
	let output = [];

	for (word of dictionary.raw) {
		let key = stringToHex(word);
		output.push({
			"name": word,
			"key": key,
		});
	}

	for (word of dictionary.hashed) {
		let key = xxhashAsHex(word);
		output.push({
			"name": word,
			"key": key,
		});
	}

	for (module in api.query) {
		if (module == "substrate") { continue; }

		for (storage in api.query[module]) {
			let query = api.query[module][storage];
			try {
				output.push({
					"name": module + " " + storage,
					"key": query.key(),
				});
			} catch {
				output.push({
					"name": module + " " + storage,
					"prefix": query.keyPrefix(),
				});
			}
		}
	}

	output.sort(sortByModule);

	const fs = require('fs')
	fs.writeFileSync(
		('./known-keys.json').toLowerCase().replace(/\s/g, '-'),
		JSON.stringify(output, null, '  ')
	);

	provider.disconnect()
}

function sortByModule(a, b) {
	return a.name.localeCompare(b.name);
}

main().catch(console.error);
