import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`API server chạy tại http://localhost:${config.port} (${config.nodeEnv})`);
});
