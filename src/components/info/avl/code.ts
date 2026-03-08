export const code = {
  full: `// AVL Tree Implementation
class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    height(node) {
        return node ? node.height : 0;
    }

    balance(node) {
        return node ? this.height(node.left) - this.height(node.right) : 0;
    }

    rightRotate(y) {
        const x = y.left;
        const t2 = x.right;
        x.right = y;
        y.left = t2;
        y.height = 1 + Math.max(this.height(y.left), this.height(y.right));
        x.height = 1 + Math.max(this.height(x.left), this.height(x.right));
        return x;
    }

    leftRotate(x) {
        const y = x.right;
        const t2 = y.left;
        y.left = x;
        x.right = t2;
        x.height = 1 + Math.max(this.height(x.left), this.height(x.right));
        y.height = 1 + Math.max(this.height(y.left), this.height(y.right));
        return y;
    }

    insert(value) {
        this.root = this._insert(this.root, value);
        return { success: true };
    }

    _insert(node, value) {
        if (!node) return new TreeNode(value);
        if (value < node.value) node.left = this._insert(node.left, value);
        else if (value > node.value) node.right = this._insert(node.right, value);
        else return node;

        node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        const b = this.balance(node);

        if (b > 1 && value < node.left.value) return this.rightRotate(node);
        if (b < -1 && value > node.right.value) return this.leftRotate(node);
        if (b > 1 && value > node.left.value) {
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }
        if (b < -1 && value < node.right.value) {
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }
        return node;
    }

    delete(value) {
        this.root = this._delete(this.root, value);
        return { success: true };
    }

    _delete(node, value) {
        if (!node) return node;
        if (value < node.value) node.left = this._delete(node.left, value);
        else if (value > node.value) node.right = this._delete(node.right, value);
        else {
            if (!node.left || !node.right) {
                node = node.left ? node.left : node.right;
            } else {
                const succ = this._minValueNode(node.right);
                node.value = succ.value;
                node.right = this._delete(node.right, succ.value);
            }
        }
        if (!node) return node;
        node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        const b = this.balance(node);
        if (b > 1 && this.balance(node.left) >= 0) return this.rightRotate(node);
        if (b > 1 && this.balance(node.left) < 0) {
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }
        if (b < -1 && this.balance(node.right) <= 0) return this.leftRotate(node);
        if (b < -1 && this.balance(node.right) > 0) {
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }
        return node;
    }

    _minValueNode(node) {
        let current = node;
        while (current.left) current = current.left;
        return current;
    }
}`
};
