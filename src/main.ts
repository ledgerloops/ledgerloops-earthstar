import * as Earthstar from "https://deno.land/x/earthstar@v10.2.2/mod.ts";
import { Saiga } from "../../saiga/src/saiga.ts";

async function simulate() {
  const shareKeys: {
    [index: string]: Earthstar.ShareKeypair
  } = {
    'alic-bobb': await Earthstar.Crypto.generateShareKeypair("albo") as Earthstar.ShareKeypair,
    'alic-char': await Earthstar.Crypto.generateShareKeypair("alch") as Earthstar.ShareKeypair,
    'bobb-char': await Earthstar.Crypto.generateShareKeypair("boch") as Earthstar.ShareKeypair,
    'alic-dave': await Earthstar.Crypto.generateShareKeypair("alda") as Earthstar.ShareKeypair,
    'alic-edwa': await Earthstar.Crypto.generateShareKeypair("aled") as Earthstar.ShareKeypair,
    'dave-edwa': await Earthstar.Crypto.generateShareKeypair("daed") as Earthstar.ShareKeypair,
  };
  const shareAddresses = Object.keys(shareKeys).map((share) => shareKeys[share].shareAddress);
  await Deno.writeTextFile("./known_shares.json", JSON.stringify(shareAddresses, null, 2) + "\n");
  new Earthstar.Server([
    new Earthstar.ExtensionKnownShares({
		knownSharesPath: "./known_shares.json",
		onCreateReplica: (address) => {
			console.log(`Creating replica for ${address}...`);

			return new Earthstar.Replica({
				driver: new Earthstar.ReplicaDriverFs(address, "./.share_data"),
			});
		},
	}),
	new Earthstar.ExtensionSyncWeb(),
]);

  const servers: {
    [index: string]: Saiga
  } = {};
  Object.keys(shareKeys).forEach((share) => {
    const participants = share.split('-');
    participants.forEach((participant) => {
      if (!servers[participant]) {
        servers[participant] = new Saiga(participant);
      }
    });
    servers[participants[0]].meet(participants[1], shareKeys[share]);
    servers[participants[1]].meet(participants[0], shareKeys[share]);
  });
}

// ...
simulate();