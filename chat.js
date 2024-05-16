import * as Earthstar from "https://deno.land/x/earthstar@v10.2.2/mod.ts";

// Use the values for shareKeypair which were logged to your console.
const shareKeypair = {
	shareAddress:
		"+chatting.bffblffbnzrjeqmh3s3vnuvztfibnzuex3e5h4nthsq7dum4mnlra",
	secret: "b4wghljrl4f4e7tedrggn72gyqvqyeqvlg6u5usi6nijwyrukbena",
};

// Use the values for authorKeypair which were logged to your console.
const authorKeypair = {
	address: "@test.bozdi5jngr2yztz5ue6qnvqpeq5flm6gpuqajikngp3wjolabgmaa",
	secret: "byrp2eqpjzdmaxllybrbrtblb54bmuwbl26n6hrfendg72zcxsduq",
};

const replica = new Earthstar.Replica({
	driver: new Earthstar.ReplicaDriverMemory(shareKeypair.shareAddress),
	shareSecret: shareKeypair.secret,
});

if (Earthstar.notErr(shareKeypair) && Earthstar.notErr(authorKeypair)) {
	console.group("Share keypair");
	console.log(shareKeypair);
	console.groupEnd();

	console.group("Author keypair");
	console.log(authorKeypair);
	console.groupEnd();
} else if (Earthstar.isErr(shareKeypair)) {
	console.error(shareKeypair);
} else if (Earthstar.isErr(authorKeypair)) {
	console.error(authorKeypair);
}

async function write(text) {
	// Write the contents of the message to the replica.
	const result = await replica.set(authorKeypair, {
		text,
		path: `/chat/~${authorKeypair.address}/${Date.now()}`,
	});
	
	if (Earthstar.isErr(result)) {
		console.error(result);
	}
}

// Read messages from chat.
// const messages = document.getElementById("messages");

const cache = new Earthstar.ReplicaCache(replica);

function renderMessages() {
	// messages.innerHTML = "";

	const chatDocs = cache.queryDocs({
		filter: { pathStartsWith: "/chat" },
	});

	for (const doc of chatDocs) {
		// const message = document.createElement("li");

		console.log(doc.text);

		// messages.append(message);
	}
}

cache.onCacheUpdated(() => {
	renderMessages();
});

renderMessages();

const peer = new Earthstar.Peer();
peer.addReplica(replica);
peer.sync("http://localhost:8000", true);