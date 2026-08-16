import './style.css';
import { Game } from './game.ts';

const app = document.querySelector<HTMLDivElement>('#app');
const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!app || !canvas) throw new Error('Shell missing');
new Game(app, canvas);
