
import { Saiga } from "https://raw.githubusercontent.com/ledgerloops/saiga/main/src/saiga.ts";
import { simulate } from "./main.ts";

simulate((name: string) => new Saiga(name));