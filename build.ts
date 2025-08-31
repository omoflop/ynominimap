import { build } from 'esbuild';
const banner =  `
// ==UserScript==
// @name         ShiniGamer Eyes
// @namespace    https://github.com/omoflop
// @version      ${new Date().toISOString().split('T')[0]}
// @description  Parody of Shinigami eyes browser extension, but for 2kki devs 
// @author       omoflop
// @match        https://ynoproject.net/*
// @grant        none
// ==/UserScript==
`.trim();

build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/shinigamereyes.user.js',
  target: 'esnext',
  format: 'iife',
  platform: 'browser',
  banner: { js: banner },
  tsconfig: 'tsconfig.json',
  treeShaking: true
});