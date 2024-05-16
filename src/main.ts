import * as Earthstar from "https://deno.land/x/earthstar@v10.2.2/mod.ts";

class Server {
  name: string;
  authorKeypair?: Earthstar.AuthorKeypair;
  constructor(name: string) {
    this.name = name;
  }
  async getAuthorKeypair(): Promise<Earthstar.AuthorKeypair> {
    if (this.authorKeypair) {
      return this.authorKeypair;
    }
    const authorKeypair: Earthstar.AuthorKeypair | Earthstar.ValidationError = await Earthstar.Crypto.generateAuthorKeypair(this.name);
    if (Earthstar.isErr(authorKeypair)) {
      console.error(authorKeypair);
      Deno.exit(1);
    }
    this.authorKeypair = authorKeypair as Earthstar.AuthorKeypair;
    return this.authorKeypair
  }
  async meet(other: string, shareKey: Earthstar.ShareKeypair) {
    const shareAddress = shareKey.shareAddress;
    const shareSecret = shareKey.secret;
    const authorKeypair = await this.getAuthorKeypair();
    const replica = new Earthstar.Replica({
      driver: new Earthstar.ReplicaDriverMemory(shareAddress),
      shareSecret,
    });
    const peer = new Earthstar.Peer();
    peer.addReplica(replica);
    peer.sync("http://localhost:8000", true);
    replica.set(authorKeypair, {
      text: `Hello, ${other}!`,
      path: `/chat/~${authorKeypair.address}/${Date.now()}`,
    });
    const cache = new Earthstar.ReplicaCache(replica);
    cache.onCacheUpdated(() => {
      const chatDocs = cache.queryDocs({
        filter: { pathStartsWith: "/chat" },
      });
      for (const doc of chatDocs) {
        console.log(`[${this.name}] ${doc.author.substr(1, 4)}: ${doc.text}`);
      }
    });
    // Work around https://github.com/earthstar-project/earthstar/issues/329
    cache.queryDocs();
    
    console.log(`${this.name} met ${other}`);
  }
}

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
    [index: string]: Server
  } = {};
  Object.keys(shareKeys).forEach((share) => {
    const participants = share.split('-');
    participants.forEach((participant) => {
      if (!servers[participant]) {
        servers[participant] = new Server(participant);
      }
    });
    servers[participants[0]].meet(participants[1], shareKeys[share]);
    servers[participants[1]].meet(participants[0], shareKeys[share]);
  });
}

// ...
simulate();