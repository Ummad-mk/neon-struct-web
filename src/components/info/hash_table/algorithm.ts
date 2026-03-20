export const algorithm = {
    insert: {
        title: 'Insert / Put',
        description: 'Computes hash index and appends to the bucket chain if it does not already exist.',
        code: `function insert(key):
    bucket = hash(key)
    if key not in table[bucket]:
        table[bucket].append(key)
        count++`
    },
    search: {
        title: 'Search / Get',
        description: 'Computes hash index and searches through that specific bucket chain.',
        code: `function search(key):
    bucket = hash(key)
    for each item in table[bucket]:
        if item == key:
            return true
    return false`
    },
    delete: {
        title: 'Delete',
        description: 'Computes hash index and removes the key from that bucket chain if found.',
        code: `function delete(key):
    bucket = hash(key)
    if key in table[bucket]:
        table[bucket].remove(key)
        count--`
    }
};
