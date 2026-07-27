import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// jsdom no expone TextEncoder/TextDecoder, que react-router v7 requiere.
Object.assign(globalThis, { TextEncoder, TextDecoder });
