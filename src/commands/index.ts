import create from "./inscript";
import get from "./get";
import deleteChar from "./delete";
import atq from "./neutre";
import config from "./config";

export const commands = [create, get, deleteChar, atq, config];
export const autoCompleteCmd = [atq];