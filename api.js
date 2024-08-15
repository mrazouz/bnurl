import fetch from 'node-fetch';
import express from 'express';
import * as cheerio from 'cheerio';

const app = express();
const port = 8000; // Ensure this port does not conflict with XAMPP's Apache port

app.get('/api', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.barnesandnoble.com',
        'Referer': 'https://www.barnesandnoble.com'
    };

    try {
        const response = await fetch(url, {
            method: 'post',
            headers: headers
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        const salePrice = $('#salePrice').val();
        const productSkuId = $('#productSkuId').val();
        let availabilityStatus = $('#availabilityStatus').val();
        const title = $('meta[property="og:title"]').attr('content');
        const image = $('meta[property="og:image"]').attr('content');

        if (availabilityStatus === '1000') {
            availabilityStatus = 'In Stock';
        } else if (availabilityStatus === '1001') {
            availabilityStatus = 'Out of Stock';
        } else {
            availabilityStatus = 'Unknown';
        }

        const productURLs = [];
        const productURLRegex = /"productURL":"(\/w\/[^"]+)"/g;
        let match;
        while ((match = productURLRegex.exec(html)) !== null) {
            productURLs.push(`https://www.barnesandnoble.com${match[1]}`);
        }
        const uniqueProductURLs = [...new Set(productURLs)];

        if (salePrice || productSkuId || availabilityStatus || title || image || uniqueProductURLs.length > 0) {
            res.status(200).json({
                Title: title || 'Not found',
                Price: salePrice || 'Not found',
                UPC: productSkuId || 'Not found',
                Status: availabilityStatus,
                Image: image || 'Not found',
                Ctgrurl: uniqueProductURLs
            });
        } else {
            res.status(404).json({ error: 'Required elements not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}/api?url=YOUR_URL_HERE`);
});
