import create from "./db/create";
import get from "./db/get";
import deleteChar from "./db/delete";
import neutre from "./roll/action";
import config from "./db/config";
import atq from "./roll/atq";
import bonus from "./utils/calcForMe";
import ticket from "./utils/ticket";
import meteo from "./utils/meteo";

export const commands = [create, get, deleteChar, atq, config, neutre, bonus, ticket, meteo];
export const autoCompleteCmd = [atq, neutre, get, deleteChar];
