import * as Earthstar from "https://deno.land/x/earthstar@v10.2.2/mod.ts";

export class Saiga {
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
  