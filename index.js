var { ApiPromise, WsProvider } = require('@polkadot/api');
var { stringToHex } = require('@polkadot/util');
var { xxhashAsHex } = require('@polkadot/util-crypto');
const dictionary = require("./dictionary.json");
const networks = require("./networks.json");

// This is a list of the "well_known_keys" in Substrate
let output = [];

async function main() {
	output = output.concat(dictionary.raw);

	for (word of dictionary.encoded) {
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

	await queryNetworks();

	// Remove duplicates
	// TODO: optimize in the original creation of output
	output = output.filter((thing, index, self) =>
		index === self.findIndex((t) => (
			t.name === thing.name && t.key === thing.key
		)));
	output.sort(sortByModule);

	const fs = require('fs')
	fs.writeFileSync(
		('./known-keys.json').toLowerCase().replace(/\s/g, '-'),
		JSON.stringify(output, null, '  ')
	);

}

// Go through each network and query the information, adding it to `output`.
async function queryNetworks() {
	for (network of networks) {
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
						"key": query.keyPrefix(),
					});
				}
			}
		}

		provider.disconnect()
	}
}

function sortByModule(a, b) {
	return a.name.localeCompare(b.name);
}

main().catch(console.error);
