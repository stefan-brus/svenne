/**
 * Markov-ish phrasebook for generating chat responses.
 *
 * Implemented as a (de)serializable map. (De)serialization methods are
 * currently implemented manually as there doesn't seem to be a simple way
 * of serializing Maps containing Sets.
 *
 * Author: Stefan Brus (github.com/stefan-brus)
 * Copyright: Yes
 * License: Beerware
 */

/**
 * `fs` is used to to (de)serialize the map to disk
 */

const fs = require('fs');

/**
* Special token denoting the end of a chain
*/

const END = '';

/**
 * Phrasebook quasi-markov-chain class
 */

class Phrasebook {

    /**
     * Constructor
     *
     * Params:
     *      order = The number of tokens per key, e.g:
     *          phrasebook["Next word is"] // "Amazing" =>
     *          phrasebook["word is Amazing"] // END
     *      file = Path to the file where the phrasebook is stored on disk
     */

    constructor(order, file) {
        this.map = new Map();
        this.order = order;
        this.file = file;
    }

    /**
     * Learn a new string
     *
     * Splits the string on whitespace, and successively inserts each entry
     * into the map, the key size depending on the `order` property.
     *
     * Params:
     *      text = The string to learn
     */

    learn(text) {
        const words = text.split(/\s+/);
        words.push(END);

        let key = [];

        words.forEach(word => {
            // Key has been built, add it to the map with the current
            // word as the following value
            if(key.length == this.order) {
                // Map can't use array values as keys, so the key is stringified
                // for storage purposes
                const key_str = key.join(' ');

                if(this.map.has(key_str)) {
                    this.map.get(key_str).add(word);
                }
                else {
                    const val = new Set();
                    val.add(word);
                    this.map.set(key_str.slice(), val);
                }
            }

            // Shift the new word into the key
            if(key.length == this.order){
                key = key.slice(1);
            }

            key.push(word);
        });
    }

    /**
     * Generate a new phrase
     *
     * Will stop once it reaches an END token, or when the generated sentence
     * contains as many words as the given limit.
     *
     * Params:
     *      limit = The max number of generation iterations
     *
     * Returns:
            The generated string
     */

    generate(limit) {
        // Can't generate a phrase if we haven't learned anything
        if(this.map.size == 0) {
            return "I don't have anything to say...";
        }

        const startKey = randomKey(this.map).split(' ');
        let nextWord = randomKey(this.map.get(startKey.join(' ')));

        const result = startKey.slice();
        result.push(nextWord);
        let nextKey = startKey.slice(1);
        nextKey.push(nextWord);

        let iterations = 0;

        while(nextWord != END && iterations < limit) {
            nextWord = randomKey(this.map.get(nextKey.join(' ')));
            result.push(nextWord);
            nextKey = nextKey.slice(1);
            nextKey.push(nextWord);
            iterations++;
        }

        return result.join(' ');
    }

    /**
     * Serialize the map and save it to disk
     *
     * TODO: Use a stream rather than dumping the whole thing at once
     */

    dump() {
        let result = '{';

        // Used to avoid trailing commas
        let firstWritten = false;

        this.map.forEach((val, key) => {
            if(firstWritten) {
                result += ',';
            }
            else {
                firstWritten = true;
            }

            result += `${JSON.stringify(key)}:${JSON.stringify(Array.from(val))}`;
        })

        result += '}';

        fs.writeFile(this.file, result, err => {
            if(err) {
                console.log(`Error writing phrasebook file: ${err}`);
                throw err;
            }

            console.log(`Successfully wrote phrasebook file (${result.length} bytes))`);
        });
    }

    /**
     * Load the map from disk and deserialize it.
     *
     * Does nothing but log a message if the file doesn't exist yet.
     */

    load() {
        if(!fs.existsSync(this.file)) {
            console.log(`No phrasebook file found, path: ${this.file}`);
            return;
        }

        fs.readFile(this.file, (err, data) => {
            if(err) {
                console.log(`Error reading phrasebook file: ${err}`);
                throw err;
            }

            this.deserialize(data);
        });
    }

    /**
     * Helper function to actually parse the serialized map.
     *
     * The serialized phrasebook is first parsed as a JSON object for easy
     * iteration, which requires a 2nd copy to be made.
     *
     * Params:
     *      str = The serialized phrasebook map
     */

    deserialize(str) {
        const json = JSON.parse(str);
        Object.keys(json).forEach(key => {
            this.map.set(key, new Set(json[key]));
        });
    }
}

module.exports = Phrasebook;

/**
 * Helper function to get a random key (or element) from a Map (or Set).
 *
 * Note that this works on both maps and sets, because there is no difference
 * between "keys" and "values" in a set.
 *
 * Params:
 *      col = The collection (Map or Set)
 *
 * Returns:
 *      A random key from `col`
 */

function randomKey(col) {
    const randomIdx = Math.floor(Math.random() * col.size);
    let curIdx = 0;

    // Iterate over the keys to avoid copying all the keys into an array
    for(let key of col.keys()) {
        if(curIdx === randomIdx) {
            return key;
        }

        curIdx++;
    }
}
