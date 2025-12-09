const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ==================== SCHEMAS ====================

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },
    image: { type: String, required: true },
    marketPrice: { type: Number, required: true },
    marketUrl: { type: String, required: true },
    marketSource: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    customer: {
        name: String,
        email: String,
        phone: String,
        address: {
            line1: String,
            line2: String,
            landmark: String,
            city: String,
            state: String,
            pincode: String
        }
    },
    items: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number
    }],
    deliveryType: String,
    deliveryCharge: Number,
    tax: Number,
    total: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// ==================== ROUTES ====================

// Health Check
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Froakie_TCG Backend Server Running',
        timestamp: new Date().toISOString()
    });
});

// ==================== PRODUCT ROUTES ====================

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create product (Admin)
app.post('/api/products', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update product (Admin)
app.put('/api/products/:id', async (req, res) => {
    try {
        req.body.updatedAt = Date.now();
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete product (Admin)
app.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update stock
app.patch('/api/products/:id/stock', async (req, res) => {
    try {
        const { quantity } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        product.stock -= quantity;
        product.updatedAt = Date.now();
        await product.save();
        
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ORDER ROUTES ====================

// Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency, customerInfo, items } = req.body;
        
        // Create Razorpay order
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency || 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                store: 'Froakie_TCG Store',
                customer_name: customerInfo.name,
                customer_email: customerInfo.email
            }
        };
        
        const razorpayOrder = await razorpay.orders.create(options);
        
        // Save order in database with pending status
        const order = new Order({
            orderId: `ORD_${Date.now()}`,
            razorpayOrderId: razorpayOrder.id,
            amount: amount,
            currency: currency || 'INR',
            status: 'pending',
            customer: customerInfo,
            items: items,
            deliveryType: customerInfo.deliveryType,
            deliveryCharge: customerInfo.deliveryCharge,
            tax: customerInfo.tax,
            total: amount
        });
        
        await order.save();
        
        res.json({ 
            success: true, 
            razorpayOrder,
            orderId: order.orderId
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify Payment
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            orderId 
        } = req.body;
        
        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        
        const isValid = expectedSignature === razorpay_signature;
        
        if (isValid) {
            // Update order status
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                    status: 'paid',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    updatedAt: Date.now()
                },
                { new: true }
            );
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Order not found' 
                });
            }
            
            // Update product stock
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } }
                );
            }
            
            res.json({ 
                success: true, 
                message: 'Payment verified successfully',
                order 
            });
        } else {
            // Update order as failed
            await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: 'failed', updatedAt: Date.now() }
            );
            
            res.status(400).json({ 
                success: false, 
                message: 'Invalid payment signature' 
            });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all orders (Admin)
app.get('/api/orders', async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        
        let query = {};
        if (status) {
            query.status = status;
        }
        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        res.json({ success: true, orders, count: orders.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single order
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.id });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Razorpay Webhook
app.post('/api/webhook', (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');
        
        if (signature === expectedSignature) {
            const event = req.body.event;
            const payload = req.body.payload.payment.entity;
            
            console.log('Webhook Event:', event);
            console.log('Payment ID:', payload.id);
            
            // Handle different events
            if (event === 'payment.captured') {
                // Payment successful
                console.log('✅ Payment captured:', payload.id);
            } else if (event === 'payment.failed') {
                // Payment failed
                console.log('❌ Payment failed:', payload.id);
            }
            
            res.json({ status: 'ok' });
        } else {
            res.status(403).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== INITIALIZE SAMPLE DATA ====================

// Initialize with sample products (run once)
app.post('/api/initialize', async (req, res) => {
    try {
        const count = await Product.countDocuments();
        
        if (count > 0) {
            return res.json({ 
                success: false, 
                message: 'Database already initialized' 
            });
        }
        
        const sampleProducts = [
            {
                name: "Charizard VMAX",
                price: 299.99,
                stock: 5,
                description: "Rainbow Rare Charizard VMAX from Champion's Path",
                image: "https://images.pokemontcg.io/swsh35/74_hires.png",
                marketPrice: 349.99,
                marketUrl: "https://www.tcgplayer.com/product/223194",
                marketSource: "TCGPlayer"
            },
            {
                name: "Pikachu VMAX",
                price: 89.99,
                stock: 12,
                description: "Vivid Voltage Rainbow Rare Pikachu VMAX",
                image: "https://images.pokemontcg.io/swsh4/188_hires.png",
                marketPrice: 95.99,
                marketUrl: "https://www.tcgplayer.com/product/226524",
                marketSource: "TCGPlayer"
            },
            {
                name: "Mewtwo & Mew GX",
                price: 45.99,
                stock: 8,
                description: "Unified Minds Secret Rare",
                image: "https://images.pokemontcg.io/sm11/222_hires.png",
                marketPrice: 52.99,
                marketUrl: "https://www.tcgplayer.com/product/192290",
                marketSource: "TCGPlayer"
            }
        ];
        
        await Product.insertMany(sampleProducts);
        
        res.json({ 
            success: true, 
            message: 'Sample products added',
            count: sampleProducts.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║   🐸 Froakie_TCG Backend Server          ║
    ║   Server running on port ${PORT}            ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
    ╚═══════════════════════════════════════════╝
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
