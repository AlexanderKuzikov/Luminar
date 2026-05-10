import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import RetouchView from './views/RetouchView.vue';
import GenerateView from './views/GenerateView.vue';
import LibraryView from './views/LibraryView.vue';
import HistoryView from './views/HistoryView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',          component: RetouchView },
    { path: '/generate',  component: GenerateView },
    { path: '/library',   component: LibraryView },
    { path: '/history',   component: HistoryView },
  ],
});

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');
