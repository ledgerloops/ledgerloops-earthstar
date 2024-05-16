import { Saiga } from "../../saiga/src/saiga.ts";
import { simulate } from "./main.ts";

simulate((name: string) => new Saiga(name));