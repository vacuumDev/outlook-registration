import { promises as fs } from 'fs';

export default class FileHandler {
    /**
     * Appends data to a file. Creates the file if it doesn't exist.
     * @param {string} filePath - Path to the file.
     * @param {string|object} data - Data to append. Objects are stringified as JSON.
     * @returns {Promise<void>}
     */
    static async appendToFile(filePath, data) {
        const content = typeof data === 'string' ? data : JSON.stringify(data);
        await fs.appendFile(filePath, content);
    }

    /**
     * Reads and parses a file.
     * If it's valid JSON, returns the parsed object.
     * Otherwise returns an array of lines.
     * @param {string} filePath - Path to the file.
     * @returns {Promise<any>}
     */
    static async parseFile(filePath) {
        const raw = await fs.readFile(filePath, 'utf-8');
        const lines = raw.split('\n');
        return lines;
    }
}
