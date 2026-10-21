const { randomUUID } = require("node:crypto");
const orderStore = require("../stores/orderStore");

const DEFAULT_ORDER_STATUS = "created";

function makeOrderId() {
    return `ord-${randomUUID().slice(0, 8)}`;
}

function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTotal(items) {
    return roundMoney(items.reduce((sum, item) => sum + item.quantity * item.price, 0));
}

function validateCreateOrder(body) {
    const problems = [];

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        problems.push("Request body must be a JSON object");
        return problems;
    }

    if (typeof body.customerName !== "string" || body.customerName.trim().length === 0) {
        problems.push("customerName is required");
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
        problems.push("At least one item is required");
        return problems;
    }

    body.items.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            problems.push(`items[${index}] must be an object`);
            return;
        }

        if (typeof item.name !== "string" || item.name.trim().length === 0) {
            problems.push(`items[${index}].name is required`);
        }

        if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity) || item.quantity <= 0) {
            problems.push(`items[${index}].quantity must be greater than zero`);
        }

        if (typeof item.price !== "number" || !Number.isFinite(item.price) || item.price <= 0) {
            problems.push(`items[${index}].price must be greater than zero`);
        }
    });

    return problems;
}

function normalizeItems(items) {
    return items.map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity,
        price: item.price,
    }));
}

function create(body) {
    const validationErrors = validateCreateOrder(body);

    if (validationErrors.length > 0) {
        return { order: null, validationErrors };
    }

    const items = normalizeItems(body.items);

    const newOrder = {
        id: makeOrderId(),
        customerName: body.customerName.trim(),
        items,
        total: calculateTotal(items),
        status: DEFAULT_ORDER_STATUS,
        createdAt: new Date().toISOString(),
    };

    const order = orderStore.add(newOrder);

    return { order, validationErrors: [] };
}

function getAll() {
    return orderStore.getAll();
}

function getById(id) {
    return orderStore.getById(id) ?? null;
}

function remove(id) {
    return orderStore.remove(id);
}

module.exports = {
    create,
    getAll,
    getById,
    remove,
};