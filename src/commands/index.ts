import create from "./inscript";
import get from "./get";
import deleteChar from "./delete";
import neutre from "./neutre";
import config from "./config";
import atq from "./atq";

export const commands = [create, get, deleteChar, atq, config, neutre];
export const autoCompleteCmd = [atq, neutre];
