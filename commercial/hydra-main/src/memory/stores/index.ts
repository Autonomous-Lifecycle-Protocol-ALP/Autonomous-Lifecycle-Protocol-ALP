import { createStore, type StoreBackend, type StoreFactoryOptions } from "./factory";

const sessionStore = createStore({ backend: "memory" });
const projectStore = createStore({ backend: "memory" });
const agentStore = createStore({ backend: "memory" });
const globalStore = createStore({ backend: "memory" });
const episodicStore = createStore({ backend: "memory" });

export { sessionStore, projectStore, agentStore, globalStore, episodicStore };
export { createStore };
export type { StoreBackend, StoreFactoryOptions };
