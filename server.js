const express = require('express');
const path = require('path');
const { searchInPdf } = require('./pdfUtils'); // Import the function from the new module

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve the HTML file
app.use(express.static(path.join(__dirname, 'public')));

// Handle search requests
app.get('/search', async (req, res) => {
    const keyword = req.query.keyword;

    if (!keyword) {
        return res.status(400).json({ error: 'Keyword query parameter is required.' });
    }

    try {
        const transactions = await searchInPdf(keyword);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
