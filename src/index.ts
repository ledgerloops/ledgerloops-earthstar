// import { Saiga } from "https://raw.githubusercontent.com/ledgerloops/saiga/main/src/saiga.ts";
import { Saiga } from "../../saiga/src/saiga.ts";
import { EarthstarMessageForwarder } from "./messaging.ts";

async function hourglass() {
    const links = [
        'alice-bob',
        'alice-charlie',
        'bob-charlie',
        'alice-dave',
        'alice-edward',
        'dave-edward',
    ];
    const messageForwarder = new EarthstarMessageForwarder(links);
    await messageForwarder.init();
    const nodes = {
        alice: new Saiga('alice', messageForwarder),
        bob: new Saiga('bob', messageForwarder),
        charlie: new Saiga('charlie', messageForwarder),
        dave: new Saiga('dave', messageForwarder),
        edward: new Saiga('edward', messageForwarder),
    };
    await nodes.alice.init();
    await nodes.bob.init();
    await nodes.charlie.init();
    await nodes.dave.init();
    await nodes.edward.init();
    await nodes.alice.meet('bob');
    await nodes.bob.meet('charlie');
    await nodes.charlie.meet('alice');
    await nodes.alice.meet('dave');
    await nodes.dave.meet('edward');
    await nodes.edward.meet('alice');
  }
  
  // ...
  hourglass(); // Run the hourglass network topology