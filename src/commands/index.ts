import create from "./create";
import get from "./get";
import deleteChar from "./delete";
import neutre from "./action";
import config from "./config";
import atq from "./atq";
import bonus from "./calcForMe";

export const commands = [create, get, deleteChar, atq, config, neutre, bonus];
export const autoCompleteCmd = [atq, neutre];
