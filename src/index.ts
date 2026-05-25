import { createApp } from './app';
import { createStore } from './models/store';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const store = createStore();
const app = createApp(store);

app.listen(PORT, () => {
  console.log(`Ecommerce store running on http://localhost:${PORT}`);
});
