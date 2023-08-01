import config from "./db/config";
import create from "./db/create";
import deleteChar from "./db/delete";
import get from "./db/get";
import neutre from "./roll/action";
import atq from "./roll/atq";
import bonus from "./utils/calcForMe";
import graph from "./utils/graph";
import meteo from "./utils/meteo";
import ticket from "./utils/ticket";
import utils from "./utils/utils";


export const commands = [create, get, deleteChar, atq, config, neutre, bonus, ticket, meteo, utils, graph];
export const autoCompleteCmd = [atq, neutre, get, deleteChar, graph];
