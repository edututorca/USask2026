const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
    try {
        // Create a dummy PPT file
        const filePath = path.join(__dirname, 'test.pptx');
        fs.writeFileSync(filePath, 'Dummy PPT content');

        const form = new FormData();
        form.append('title', 'Test Presentation');
        // Multer expects 'pdf' field name based on server.js/documents.js configuration
        form.append('pdf', fs.createReadStream(filePath), {
            filename: 'test.pptx',
            contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        });

        console.log('Attempting upload to http://localhost:3000/api/documents...');

        const response = await axios.post('http://localhost:3000/api/documents', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Upload successful!');
        console.log('Status:', response.status);
        console.log('Data:', response.data);

        // Cleanup
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Upload failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
            console.error('Error Code:', error.code);
        }
        // Cleanup even on error
        const filePath = path.join(__dirname, 'test.pptx');
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}

testUpload();
