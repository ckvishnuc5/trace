import { ApigeeClient } from './src/server/services/ApigeeClient';
const client = new ApigeeClient('my-org', 'my-token');
client.listProxies().then(console.log).catch(e => console.error("Error caught:", e));
