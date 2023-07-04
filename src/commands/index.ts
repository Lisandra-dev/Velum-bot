import create from "./inscript";
import get from "./get";
import deleteChar from "./delete";
import atq from "./neutre";

export const commands = [create, get, deleteChar, atq];
export const autoCompleteCmd = [atq];