const { Client } = require('@notionhq/client');

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function addPaperToNotion(paperData) {
    if (!databaseId || !process.env.NOTION_API_KEY) {
        console.warn('Notion API Key or Database ID missing. Skipping Notion update.');
        return;
    }

    try {
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Title: {
                    title: [{ text: { content: paperData.title } }],
                },
                URL: {
                    url: paperData.url,
                },
                Feasibility: {
                    select: { name: paperData.feasibility },
                },
                Score: {
                    number: paperData.score,
                },
                Status: {
                    select: { name: paperData.status },
                },
                Summary: {
                    rich_text: [{ text: { content: paperData.summary } }],
                },
            },
        });
        console.log('Successfully added to Notion:', response.id);
        return response;
    } catch (error) {
        console.error('Error adding to Notion:', error.body || error.message);
    }
}

module.exports = { addPaperToNotion };
