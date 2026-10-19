const express = require("express");
const orderService = require("../services/orderService");

const router = express.Router();

function copyItem(item) {
    return {
        name: item.name,
        quantity: item.quantity,
        price: item.price,
    };
}

function orderResponse(order) {
    return {
        id: order.id,
        customerName: order.customerName,
        items: order.items.map(copyItem),
        total: order.total,
        status: order.status,
    };
}

function validationProblem(message, details) {
    return {
        error: {
            code: "VALIDATION_ERROR",
            message,
            details,
        },
    };
}

function notFoundProblem() {
    return {
        error: {
            code: "ORDER_NOT_FOUND",
            message: "Order not found",
        },
    };
}

router.post("/", async (req, res, next) => {
    try {
        const result = await orderService.create(req.body);

        if (result.validationErrors.length > 0) {
            return res.status(400).json(validationProblem("Invalid order", result.validationErrors));
        }

        return res.status(201).location(`/orders/${result.order.id}`).json(orderResponse(result.order));
    } catch (error) {
        return next(error);
    }
});

router.get("/", (req, res) => {
    const orders = orderService.getAll().map((order) => orderResponse(order));

    return res.status(200).json({
        orders,
        count: orders.length,
    });
});

router.get("/:id", async (req, res, next) => {
    try {
        const order = await orderService.getById(req.params.id);

        if (!order) {
            return res.status(404).json(notFoundProblem());
        }

        return res.status(200).json(orderResponse(order));
    } catch (error) {
        return next(error);
    }
});

router.delete("/:id", async (req, res, next) => {
    try {
        const removed = await orderService.remove(req.params.id);

        if (!removed) {
            return res.status(404).json(notFoundProblem());
        }

        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;