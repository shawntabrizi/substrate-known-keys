# substrate-known-keys
 A list of all the known keys commonly used in Substrate.

 [known-keys.json](./known-keys.json)

## How To Use

```
yarn && yarn start <endpoint>
```

Output to [known-keys.json](./known-keys.json)

`<endpoint>` can be:

* `polkadot`: `wss://rpc.polkadot.io/`
* `kusama`: `wss://kusama-rpc.polkadot.io/`
* `local`: `ws://127.0.0.1:9944`
* or a custom websocket endpoint url

Omitting an endpoint will connect you to `kusama`.
