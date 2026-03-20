import { algorithm } from './algorithm';

export const hash_table = {
    title: 'Hash Table (Separate Chaining)',
    description: 'A Hash Table is a data structure that implements an associative array abstract data type, a structure that can map keys to values. It uses a hash function to compute an index into an array of buckets or slots, from which the desired value can be found. This implementation handles collisions via separate chaining (linked lists at each bucket).',
    complexities: {
        time: {
            search: 'O(1) avg, O(n) worst',
            insert: 'O(1) avg, O(n) worst',
            delete: 'O(1) avg, O(n) worst'
        },
        space: 'O(n) where n is number of stored items'
    },
    algorithm
};
