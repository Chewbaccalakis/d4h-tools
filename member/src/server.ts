import express from 'express';
import cors from 'cors';
import { d4hInstance } from './initD4H';
import { RefreshMembers } from './api/refreshMembers';

const app = express();
const port = 3000;

// CORS setup
app.use(cors());

const basePath = '/api/members'

app.get(`${basePath}`, (req, res) => {
    try {
      // Send an HTML response with "Hello World"
      res.status(200).send('<html><body><h1>Hello World</h1></body></html>');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error');
    }
  });

// Endpoint to trigger PDF generation
app.get(`${basePath}/refresh-members`, async (req, res) => {
    try {
        const refreshMembers = new RefreshMembers(); // Create an instance of the class
        const members = await refreshMembers.refreshMembers(); // Call the getMembers method
        res.status(200).json(members); // Return the result
      } catch (error) {
        console.error('Error refreshing members:', error);
        res.status(500).send('Failed to fetch members');
      }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
